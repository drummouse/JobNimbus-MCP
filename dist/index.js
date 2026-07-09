"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
// ─── Config ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.JOBNIMBUS_API_KEY ?? "";
const BASE_URL = "https://app.jobnimbus.com/api1";
if (!API_KEY) {
    process.stderr.write("Error: JOBNIMBUS_API_KEY environment variable is required\n");
    process.exit(1);
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
async function jnFetch(method, endpoint, body, qs) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    if (qs)
        Object.entries(qs).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok)
        throw new Error(`JobNimbus ${res.status}: ${text}`);
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
function mkFilter(must) {
    return JSON.stringify({ must });
}
function ok(data) {
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function parseCustomFields(json) {
    if (!json)
        return {};
    try {
        return JSON.parse(json);
    }
    catch {
        throw new Error("custom_fields_json must be valid JSON");
    }
}
// ─── Server ───────────────────────────────────────────────────────────────────
const server = new mcp_js_1.McpServer({ name: "jobnimbus", version: "1.0.0" });
// ── CONTACTS ──────────────────────────────────────────────────────────────────
server.registerTool("jn_list_contacts", {
    description: "List or search contacts in JobNimbus.",
    inputSchema: {
        size: zod_1.z.number().min(1).max(1000).optional().default(50),
        from: zod_1.z.number().min(0).optional().default(0),
        sort_field: zod_1.z.string().optional().default("date_created"),
        sort_direction: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        filter_name: zod_1.z.string().optional().describe("Partial match on display name"),
        filter_email: zod_1.z.string().optional().describe("Exact match on email"),
        filter_status: zod_1.z.string().optional().describe("Exact match on status name"),
    },
}, async ({ size, from, sort_field, sort_direction, filter_name, filter_email, filter_status }) => {
    const must = [];
    if (filter_name)
        must.push({ wildcard: { display_name: `*${filter_name}*` } });
    if (filter_email)
        must.push({ term: { email: filter_email } });
    if (filter_status)
        must.push({ term: { status_name: filter_status } });
    const qs = {
        size: String(size), from: String(from),
        sort_field: sort_field ?? "date_created",
        sort_direction: sort_direction ?? "desc",
    };
    if (must.length)
        qs.filter = mkFilter(must);
    return ok(await jnFetch("GET", "contacts", undefined, qs));
});
server.registerTool("jn_get_contact", {
    description: "Get a single JobNimbus contact by jnid.",
    inputSchema: { jnid: zod_1.z.string().describe("Contact jnid") },
}, async ({ jnid }) => ok(await jnFetch("GET", `contacts/${jnid}`)));
server.registerTool("jn_create_contact", {
    description: "Create a new contact in JobNimbus.",
    inputSchema: {
        first_name: zod_1.z.string().optional(),
        last_name: zod_1.z.string().optional(),
        display_name: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        mobile_phone: zod_1.z.string().optional(),
        address_line1: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state_text: zod_1.z.string().optional(),
        zip: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        status_name: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        custom_fields_json: zod_1.z.string().optional().describe("JSON string of custom field key-value pairs"),
    },
}, async ({ custom_fields_json, ...rest }) => {
    const body = { ...rest, ...parseCustomFields(custom_fields_json) };
    return ok(await jnFetch("POST", "contacts", body));
});
server.registerTool("jn_update_contact", {
    description: "Update a contact in JobNimbus.",
    inputSchema: {
        jnid: zod_1.z.string().describe("Contact jnid to update"),
        first_name: zod_1.z.string().optional(),
        last_name: zod_1.z.string().optional(),
        display_name: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        mobile_phone: zod_1.z.string().optional(),
        address_line1: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state_text: zod_1.z.string().optional(),
        zip: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        status_name: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        custom_fields_json: zod_1.z.string().optional().describe("JSON string of custom field key-value pairs"),
    },
}, async ({ jnid, custom_fields_json, ...rest }) => {
    const body = { ...rest, ...parseCustomFields(custom_fields_json) };
    return ok(await jnFetch("PUT", `contacts/${jnid}`, body));
});
// ── JOBS ──────────────────────────────────────────────────────────────────────
server.registerTool("jn_list_jobs", {
    description: "List or search jobs in JobNimbus.",
    inputSchema: {
        size: zod_1.z.number().min(1).max(1000).optional().default(50),
        from: zod_1.z.number().min(0).optional().default(0),
        sort_field: zod_1.z.string().optional().default("date_created"),
        sort_direction: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
        filter_status: zod_1.z.string().optional().describe("Filter by status/stage name"),
        filter_contact_jnid: zod_1.z.string().optional().describe("Filter by related contact jnid"),
        filter_name: zod_1.z.string().optional().describe("Partial match on job name"),
        updated_since: zod_1.z.number().optional().describe("Unix timestamp — jobs updated after this time"),
    },
}, async ({ size, from, sort_field, sort_direction, filter_status, filter_contact_jnid, filter_name, updated_since }) => {
    const must = [];
    if (filter_status)
        must.push({ term: { status_name: filter_status } });
    if (filter_contact_jnid)
        must.push({ term: { "related.id": filter_contact_jnid } });
    if (filter_name)
        must.push({ wildcard: { name: `*${filter_name}*` } });
    if (updated_since)
        must.push({ range: { date_updated: { gte: updated_since } } });
    const qs = {
        size: String(size), from: String(from),
        sort_field: sort_field ?? "date_created",
        sort_direction: sort_direction ?? "desc",
    };
    if (must.length)
        qs.filter = mkFilter(must);
    return ok(await jnFetch("GET", "jobs", undefined, qs));
});
server.registerTool("jn_get_job", {
    description: "Get a single JobNimbus job by jnid.",
    inputSchema: { jnid: zod_1.z.string().describe("Job jnid") },
}, async ({ jnid }) => ok(await jnFetch("GET", `jobs/${jnid}`)));
server.registerTool("jn_create_job", {
    description: "Create a new job in JobNimbus. Pass GHL Lead Number and Job Number via custom_fields_json.",
    inputSchema: {
        name: zod_1.z.string().describe("Job name/title"),
        contact_jnid: zod_1.z.string().optional().describe("jnid of the related contact"),
        status_name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        address_line1: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state_text: zod_1.z.string().optional(),
        zip: zod_1.z.string().optional(),
        geo_lat: zod_1.z.number().optional().describe("GPS latitude"),
        geo_lon: zod_1.z.number().optional().describe("GPS longitude"),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        custom_fields_json: zod_1.z.string().optional().describe('JSON string of custom fields, e.g. {"Lead Number":"L-001","Job Number":"J-001","Plus Code":"XXXX+XX"}'),
    },
}, async ({ contact_jnid, custom_fields_json, ...rest }) => {
    const body = { ...rest, ...parseCustomFields(custom_fields_json) };
    if (contact_jnid)
        body.related = [{ id: contact_jnid, type: "contact" }];
    return ok(await jnFetch("POST", "jobs", body));
});
server.registerTool("jn_update_job", {
    description: "Update a job in JobNimbus. Use custom_fields_json for Lead Number, Job Number, GPS, Plus Code from GHL.",
    inputSchema: {
        jnid: zod_1.z.string().describe("Job jnid to update"),
        name: zod_1.z.string().optional(),
        status_name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        address_line1: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        state_text: zod_1.z.string().optional(),
        zip: zod_1.z.string().optional(),
        geo_lat: zod_1.z.number().optional().describe("GPS latitude"),
        geo_lon: zod_1.z.number().optional().describe("GPS longitude"),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        custom_fields_json: zod_1.z.string().optional().describe('JSON string of custom fields, e.g. {"Lead Number":"L-001","Plus Code":"XXXX+XX"}'),
    },
}, async ({ jnid, custom_fields_json, ...rest }) => {
    const body = { ...rest, ...parseCustomFields(custom_fields_json) };
    return ok(await jnFetch("PUT", `jobs/${jnid}`, body));
});
// ── NOTES ─────────────────────────────────────────────────────────────────────
// Notes in JobNimbus are stored as activities with record_type=1.
// is_status_change=true means system-generated — we exclude those.
server.registerTool("jn_list_notes", {
    description: "List user-written notes on a contact or job. Excludes system-generated status change notes.",
    inputSchema: {
        related_jnid: zod_1.z.string().optional().describe("Filter by related contact or job jnid"),
        size: zod_1.z.number().optional().default(50),
        from: zod_1.z.number().optional().default(0),
    },
}, async ({ related_jnid, size, from }) => {
    // Notes are activities with record_type=1 and is_status_change=false
    const must = [
        { term: { record_type: 1 } },
        { term: { is_status_change: false } },
    ];
    if (related_jnid)
        must.push({ term: { "related.id": related_jnid } });
    const qs = { size: String(size), from: String(from) };
    qs.filter = mkFilter(must);
    return ok(await jnFetch("GET", "activities", undefined, qs));
});
server.registerTool("jn_create_note", {
    description: "Add a note to a contact or job in JobNimbus.",
    inputSchema: {
        note: zod_1.z.string().describe("Note text content"),
        related_jnid: zod_1.z.string().describe("jnid of the contact or job"),
        related_type: zod_1.z.enum(["contact", "job"]),
    },
}, async ({ note, related_jnid, related_type }) => {
    // Notes are posted as activities with record_type=1
    const body = {
        note,
        record_type: 1,
        related: [{ id: related_jnid, type: related_type }],
    };
    return ok(await jnFetch("POST", "activities", body));
});
// ── FILES ─────────────────────────────────────────────────────────────────────
server.registerTool("jn_list_files", {
    description: "List files and photo attachments linked to a contact or job.",
    inputSchema: {
        related_jnid: zod_1.z.string().optional().describe("Filter by related contact or job jnid"),
        size: zod_1.z.number().optional().default(50),
        from: zod_1.z.number().optional().default(0),
    },
}, async ({ related_jnid, size, from }) => {
    const must = [];
    if (related_jnid)
        must.push({ term: { "related.id": related_jnid } });
    const qs = { size: String(size), from: String(from) };
    if (must.length)
        qs.filter = mkFilter(must);
    return ok(await jnFetch("GET", "files", undefined, qs));
});
// ── TASKS ─────────────────────────────────────────────────────────────────────
server.registerTool("jn_list_tasks", {
    description: "List tasks in JobNimbus.",
    inputSchema: {
        related_jnid: zod_1.z.string().optional().describe("Filter by related contact or job jnid"),
        size: zod_1.z.number().optional().default(50),
        from: zod_1.z.number().optional().default(0),
    },
}, async ({ related_jnid, size, from }) => {
    const must = [];
    if (related_jnid)
        must.push({ term: { "related.id": related_jnid } });
    const qs = { size: String(size), from: String(from) };
    if (must.length)
        qs.filter = mkFilter(must);
    return ok(await jnFetch("GET", "tasks", undefined, qs));
});
server.registerTool("jn_create_task", {
    description: "Create a task in JobNimbus linked to a contact or job.",
    inputSchema: {
        title: zod_1.z.string(),
        related_jnid: zod_1.z.string().describe("jnid of the related contact or job"),
        related_type: zod_1.z.enum(["contact", "job"]),
        due_date: zod_1.z.number().optional().describe("Unix timestamp"),
        assigned_to: zod_1.z.string().optional().describe("Assignee email"),
        note: zod_1.z.string().optional(),
    },
}, async ({ title, related_jnid, related_type, due_date, assigned_to, note }) => {
    const body = {
        title,
        related: [{ id: related_jnid, type: related_type }],
    };
    if (due_date)
        body.date_due = due_date;
    if (assigned_to)
        body.assigned_to = assigned_to;
    if (note)
        body.note = note;
    return ok(await jnFetch("POST", "tasks", body));
});
// ── ESTIMATES / INVOICES / ACTIVITIES ─────────────────────────────────────────
const listSchema = {
    related_jnid: zod_1.z.string().optional(),
    size: zod_1.z.number().optional().default(50),
    from: zod_1.z.number().optional().default(0),
};
async function listEndpoint(endpoint, { related_jnid, size = 50, from = 0 }) {
    const must = [];
    if (related_jnid)
        must.push({ term: { "related.id": related_jnid } });
    const qs = { size: String(size), from: String(from) };
    if (must.length)
        qs.filter = mkFilter(must);
    return ok(await jnFetch("GET", endpoint, undefined, qs));
}
server.registerTool("jn_list_estimates", {
    description: "List estimates in JobNimbus.",
    inputSchema: listSchema,
}, async (args) => listEndpoint("estimates", args));
server.registerTool("jn_list_invoices", {
    description: "List invoices in JobNimbus.",
    inputSchema: listSchema,
}, async (args) => listEndpoint("invoices", args));
server.registerTool("jn_list_activities", {
    description: "List all activity records (calls, emails, status changes, etc.) in JobNimbus. Note: response key is 'activity' not 'results'.",
    inputSchema: listSchema,
}, async (args) => listEndpoint("activities", args));
server.registerTool("jn_list_material_orders", {
    description: "List material orders in JobNimbus.",
    inputSchema: listSchema,
}, async (args) => listEndpoint("materialorders", args));
server.registerTool("jn_list_work_orders", {
    description: "List work orders in JobNimbus.",
    inputSchema: listSchema,
}, async (args) => listEndpoint("workorders", args));
// ── ACCOUNT ───────────────────────────────────────────────────────────────────
server.registerTool("jn_get_account", {
    description: "Get JobNimbus account info: workflow stages, users, custom field definitions.",
}, async () => ok(await jnFetch("GET", "account")));
// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("JobNimbus MCP Server running\n");
}
main().catch((err) => {
    process.stderr.write(`Fatal: ${err}\n`);
    process.exit(1);
});
