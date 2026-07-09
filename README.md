# JobNimbus MCP Server

Connects Claude directly to your JobNimbus account via the API.

## Tools Available

| Tool | Description |
|------|-------------|
| `jn_list_contacts` | List/search contacts (filter by name, email, status) |
| `jn_get_contact` | Get a single contact by jnid |
| `jn_create_contact` | Create a new contact |
| `jn_update_contact` | Update contact fields + custom fields |
| `jn_list_jobs` | List/search jobs (filter by status, contact, name) |
| `jn_get_job` | Get a single job by jnid |
| `jn_create_job` | Create a new job (with Lead Number, Job Number, GPS, Plus Code) |
| `jn_update_job` | Update job fields + GHL migration fields |
| `jn_list_notes` | List notes on a contact or job |
| `jn_create_note` | Add a note to a contact or job |
| `jn_list_files` | List file/photo attachments |
| `jn_list_tasks` | List tasks |
| `jn_create_task` | Create a task |
| `jn_list_estimates` | List estimates |
| `jn_list_invoices` | List invoices |
| `jn_list_activities` | List activity records |
| `jn_list_material_orders` | List material orders |
| `jn_list_work_orders` | List work orders |
| `jn_get_account` | Get account info, stages, custom field definitions |

## Installation

### 1. Install dependencies and build

```bash
cd jobnimbus-mcp
npm install
npm run build
```

### 2. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "jobnimbus": {
      "command": "node",
      "args": ["/FULL/PATH/TO/jobnimbus-mcp/dist/index.js"],
      "env": {
        "JOBNIMBUS_API_KEY": "your-jobnimbus-api-key"
      }
    }
  }
}
```

Replace `/FULL/PATH/TO/jobnimbus-mcp` with the actual absolute path where you placed this folder.

### 3. Restart Claude Desktop

The JobNimbus tools will appear in Claude's tool list.

---

## GHL → JobNimbus Migration: Custom Fields

When migrating assets from GoHighLevel, use `custom_fields_json` to write GHL data into JobNimbus custom fields:

```json
{
  "Lead Number": "L-1234",
  "Job Number": "J-5678",
  "Plus Code": "87JC+9W Edmonton",
  "GPS Coordinates": "53.5461,-113.4938"
}
```

**Example prompt to Claude:**
> "Update JobNimbus job [jnid] with GHL Lead Number L-1234, Job Number J-5678, and Plus Code 87JC+9W"

---

## Security Note

⚠️ **Rotate your API key** in JobNimbus Settings → API if it has been shared in any chat or document. Generate a new key and update the config above.
