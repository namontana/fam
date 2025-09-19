import { z } from "zod";
import { BaseTool, ToolArgs, McpResponse } from "./base-tool.js";

const BMLT_API_BASE = "https://bmlt.mtrna.org/prod";
const USER_AGENT = "fam/0.0.1";

interface BmltMeeting {
  id_bigint: string;
  meeting_name: string;
  start_time: string;
  duration_time: string;
  location_text: string;
  location_info: string;
  location_street: string;
  location_city_subsection: string;
  location_municipality: string;
  location_province: string;
  location_postal_code_1: string;
  comments: string;
  format_shared_id_list: string;
}

interface BmltResponse {
  meetings?: BmltMeeting[];
  error?: string;
}

export class BmltClient extends BaseTool {
  name = "bmlt_search";
  description = "Search for meetings in the BMLT (Basic Meeting List Toolbox) database";
  args: ToolArgs = {
    location: z.string().optional().describe("Location to search for meetings (city, zip code, etc.)"),
    weekday: z.number().min(1).max(7).optional().describe("Day of week (1=Sunday, 7=Saturday)"),
    format: z.string().optional().describe("Meeting format to search for"),
    limit: z.number().min(1).max(50).optional().describe("Maximum number of results to return (default: 10)")
  };

  async callback(params: Record<string, any>): Promise<McpResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      // Add search parameters
      if (params.location) {
        searchParams.append("SearchString", params.location);
      }
      if (params.weekday) {
        searchParams.append("weekdays[]", params.weekday.toString());
      }
      if (params.format) {
        searchParams.append("formats[]", params.format);
      }
      
      // Set default limit
      const limit = params.limit || 10;
      searchParams.append("limit", limit.toString());
      
      // Always request JSON format
      searchParams.append("switcher", "GetSearchResults");
      searchParams.append("data_field_key", "location_text,meeting_name,start_time,duration_time,location_street,location_municipality,location_province,comments,format_shared_id_list");

      const apiUrl = `${BMLT_API_BASE}/client_interface/json/?${searchParams.toString()}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return {
          content: [{
            type: "text",
            text: `Failed to retrieve BMLT data: ${response.status} ${response.statusText}`
          }]
        };
      }

      const data: BmltResponse = await response.json();

      if (data.error) {
        return {
          content: [{
            type: "text",
            text: `BMLT API error: ${data.error}`
          }]
        };
      }

      const meetings = data.meetings || [];
      
      if (meetings.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No meetings found matching your search criteria."
          }]
        };
      }

      // Format the meeting results
      const formattedMeetings = meetings.map(meeting => {
        const location = [
          meeting.location_text,
          meeting.location_street,
          meeting.location_municipality,
          meeting.location_province
        ].filter(Boolean).join(", ");

        return `**${meeting.meeting_name}**
- Time: ${meeting.start_time} (${meeting.duration_time})
- Location: ${location}
- Comments: ${meeting.comments || "None"}
- ID: ${meeting.id_bigint}`;
      }).join("\n\n");

      return {
        content: [{
          type: "text",
          text: `Found ${meetings.length} meeting(s):\n\n${formattedMeetings}`
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error searching BMLT: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }
}