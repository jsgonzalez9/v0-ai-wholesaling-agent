module.exports = [
"[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/supabase/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f40$supabase$2b$ssr$40$0$2e$8$2e$0_$40$supabase$2b$supabase$2d$js$40$2$2e$86$2e$2$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/node_modules/.pnpm/@supabase+ssr@0.8.0_@supabase+supabase-js@2.86.2/node_modules/@supabase/ssr/dist/module/index.js [app-rsc] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f40$supabase$2b$ssr$40$0$2e$8$2e$0_$40$supabase$2b$supabase$2d$js$40$2$2e$86$2e$2$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/node_modules/.pnpm/@supabase+ssr@0.8.0_@supabase+supabase-js@2.86.2/node_modules/@supabase/ssr/dist/module/createServerClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/node_modules/.pnpm/next@16.0.7_@opentelemetry+api@1.9.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/headers.js [app-rsc] (ecmascript)");
;
;
async function createClient() {
    const cookieStore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$headers$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["cookies"])();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f40$supabase$2b$ssr$40$0$2e$8$2e$0_$40$supabase$2b$supabase$2d$js$40$2$2e$86$2e$2$2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createServerClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createServerClient"])(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll () {
                return cookieStore.getAll();
            },
            setAll (cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options })=>cookieStore.set(name, value, options));
                } catch  {
                // Server Component - ignore
                }
            }
        }
    });
}
}),
"[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/lead-actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"002c5adcb366e4076c0cd12c2b86fbdbdb64c2d9c7":"checkDatabaseSetup","005999aae611178ce8784719c9c6333aee16b35c28":"getAllLeads","400609700ba52b80645444547cbc0830f634356334":"createLead","4022b0dba2dc0d1b66e3686f37a7eb976d8462e0f9":"saveMessage","402bd1136adcf5274fc019124575f584ffd1a6696a":"getLeadById","4080eb8de79f0debc24da8d3010fef96b8d9dbf45a":"bulkImportLeads","40ab2c4fa11b4d64c20531d89307c489849967a57a":"getLeadByPhone","40bf1748f7f05911b15043a11c894844cd0e011fee":"getLeadMessages","40dd8866c0034daceb90e51f4b95f982d977174bff":"deleteLead","60c610049392efd141ca188aeb5a44a839558812ed":"updateLead"},"",""] */ __turbopack_context__.s([
    "bulkImportLeads",
    ()=>bulkImportLeads,
    "checkDatabaseSetup",
    ()=>checkDatabaseSetup,
    "createLead",
    ()=>createLead,
    "deleteLead",
    ()=>deleteLead,
    "getAllLeads",
    ()=>getAllLeads,
    "getLeadById",
    ()=>getLeadById,
    "getLeadByPhone",
    ()=>getLeadByPhone,
    "getLeadMessages",
    ()=>getLeadMessages,
    "saveMessage",
    ()=>saveMessage,
    "updateLead",
    ()=>updateLead
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/node_modules/.pnpm/next@16.0.7_@opentelemetry+api@1.9.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/supabase/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/node_modules/.pnpm/next@16.0.7_@opentelemetry+api@1.9.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/node_modules/.pnpm/next@16.0.7_@opentelemetry+api@1.9.0_react-dom@19.2.0_react@19.2.0__react@19.2.0/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function createLead(data) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Format phone number (ensure it starts with +1 for US)
    let phone = data.phone_number.replace(/\D/g, "");
    if (phone.length === 10) {
        phone = `+1${phone}`;
    } else if (phone.length === 11 && phone.startsWith("1")) {
        phone = `+${phone}`;
    } else if (!phone.startsWith("+")) {
        phone = `+${phone}`;
    }
    const { data: lead, error } = await supabase.from("leads").insert({
        name: data.name,
        phone_number: phone,
        address: data.address,
        notes: data.notes || null,
        arv: data.arv || null,
        repair_estimate: data.repair_estimate || null,
        conversation_state: "cold_lead"
    }).select().single();
    if (error) {
        console.error("Error creating lead:", error);
        return {
            lead: null,
            error: error.message
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    return {
        lead: lead,
        error: null
    };
}
async function updateLead(id, data) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: lead, error } = await supabase.from("leads").update({
        ...data,
        updated_at: new Date().toISOString()
    }).eq("id", id).select().single();
    if (error) {
        console.error("Error updating lead:", error);
        return {
            lead: null,
            error: error.message
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    return {
        lead: lead,
        error: null
    };
}
async function getLeadByPhone(phone) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    // Normalize phone number
    let normalizedPhone = phone.replace(/\D/g, "");
    if (normalizedPhone.length === 10) {
        normalizedPhone = `+1${normalizedPhone}`;
    } else if (normalizedPhone.length === 11 && normalizedPhone.startsWith("1")) {
        normalizedPhone = `+${normalizedPhone}`;
    } else if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = `+${normalizedPhone}`;
    }
    const { data, error } = await supabase.from("leads").select("*").eq("phone_number", normalizedPhone).single();
    if (error || !data) {
        return null;
    }
    return data;
}
async function getLeadById(id) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
    if (error || !data) {
        return null;
    }
    return data;
}
async function getAllLeads() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("leads").select("*").order("updated_at", {
        ascending: false
    });
    if (error) {
        console.error("Error fetching leads:", error);
        return [];
    }
    return data;
}
async function saveMessage(data) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data: message, error } = await supabase.from("messages").insert({
        lead_id: data.lead_id,
        direction: data.direction,
        content: data.content,
        twilio_sid: data.twilio_sid || null,
        model_used: data.model_used || null,
        was_escalated: data.was_escalated || false
    }).select().single();
    if (error) {
        console.error("Error saving message:", error);
        return {
            message: null,
            error: error.message
        };
    }
    // Update lead's last_message_at
    await supabase.from("leads").update({
        last_message_at: new Date().toISOString()
    }).eq("id", data.lead_id);
    return {
        message: message,
        error: null
    };
}
async function getLeadMessages(leadId) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { data, error } = await supabase.from("messages").select("*").eq("lead_id", leadId).order("created_at", {
        ascending: true
    });
    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
    return data;
}
async function deleteLead(id) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
        console.error("Error deleting lead:", error);
        return {
            error: error.message
        };
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    return {
        error: null
    };
}
async function checkDatabaseSetup() {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    try {
        // Try to query the leads table with a minimal query
        const { error } = await supabase.from("leads").select("id").limit(1);
        return !error;
    } catch  {
        return false;
    }
}
async function bulkImportLeads(leads) {
    const supabase = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$supabase$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createClient"])();
    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    for (const leadData of leads){
        // Format phone number
        let phone = leadData.phone_number.replace(/\D/g, "");
        if (phone.length === 10) {
            phone = `+1${phone}`;
        } else if (phone.length === 11 && phone.startsWith("1")) {
            phone = `+${phone}`;
        } else if (!phone.startsWith("+")) {
            phone = `+${phone}`;
        }
        // Check if lead already exists
        const { data: existing } = await supabase.from("leads").select("id").eq("phone_number", phone).single();
        if (existing) {
            errors.push(`Lead with phone ${leadData.phone_number} already exists`);
            failedCount++;
            continue;
        }
        const { error } = await supabase.from("leads").insert({
            name: leadData.name,
            phone_number: phone,
            address: leadData.address,
            notes: leadData.notes || null,
            arv: leadData.arv || null,
            repair_estimate: leadData.repair_estimate || null,
            conversation_state: "cold_lead"
        });
        if (error) {
            errors.push(`Failed to import ${leadData.name}: ${error.message}`);
            failedCount++;
        } else {
            successCount++;
        }
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/dashboard");
    return {
        successCount,
        failedCount,
        errors
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createLead,
    updateLead,
    getLeadByPhone,
    getLeadById,
    getAllLeads,
    saveMessage,
    getLeadMessages,
    deleteLead,
    checkDatabaseSetup,
    bulkImportLeads
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createLead, "400609700ba52b80645444547cbc0830f634356334", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateLead, "60c610049392efd141ca188aeb5a44a839558812ed", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getLeadByPhone, "40ab2c4fa11b4d64c20531d89307c489849967a57a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getLeadById, "402bd1136adcf5274fc019124575f584ffd1a6696a", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getAllLeads, "005999aae611178ce8784719c9c6333aee16b35c28", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(saveMessage, "4022b0dba2dc0d1b66e3686f37a7eb976d8462e0f9", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getLeadMessages, "40bf1748f7f05911b15043a11c894844cd0e011fee", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteLead, "40dd8866c0034daceb90e51f4b95f982d977174bff", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(checkDatabaseSetup, "002c5adcb366e4076c0cd12c2b86fbdbdb64c2d9c7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$0$2e$7_$40$opentelemetry$2b$api$40$1$2e$9$2e$0_react$2d$dom$40$19$2e$2$2e$0_react$40$19$2e$2$2e$0_$5f$react$40$19$2e$2$2e$0$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(bulkImportLeads, "4080eb8de79f0debc24da8d3010fef96b8d9dbf45a", null);
}),
"[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/.next-internal/server/app/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/lead-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/lead-actions.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
}),
"[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/.next-internal/server/app/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/lead-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "002c5adcb366e4076c0cd12c2b86fbdbdb64c2d9c7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["checkDatabaseSetup"],
    "005999aae611178ce8784719c9c6333aee16b35c28",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAllLeads"],
    "400609700ba52b80645444547cbc0830f634356334",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createLead"],
    "4022b0dba2dc0d1b66e3686f37a7eb976d8462e0f9",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["saveMessage"],
    "402bd1136adcf5274fc019124575f584ffd1a6696a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLeadById"],
    "4080eb8de79f0debc24da8d3010fef96b8d9dbf45a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["bulkImportLeads"],
    "40ab2c4fa11b4d64c20531d89307c489849967a57a",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLeadByPhone"],
    "40bf1748f7f05911b15043a11c894844cd0e011fee",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLeadMessages"],
    "40dd8866c0034daceb90e51f4b95f982d977174bff",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteLead"],
    "60c610049392efd141ca188aeb5a44a839558812ed",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateLead"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f2e$next$2d$internal$2f$server$2f$app$2f$dashboard$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/.next-internal/server/app/dashboard/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/lead-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$WHOLESALE__AI$2f$v0$2d$ai$2d$wholesaling$2d$agent$2f$lib$2f$lead$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/WHOLESALE AI/v0-ai-wholesaling-agent/lib/lead-actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=Desktop_WHOLESALE%20AI_v0-ai-wholesaling-agent_7e26148b._.js.map