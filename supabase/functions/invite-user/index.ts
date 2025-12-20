import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 🎨 HTML Templates
const getTemplate = (type: string, data: any) => {
    const { url, role, tournament_name } = data;
    const primaryColor = "#2563eb"; // Blue 600

    // Header Component
    const header = `
    <div style="background-color: #111; padding: 20px; text-align: center; border-bottom: 2px solid ${primaryColor};">
        <h1 style="color: #fff; margin: 0; font-family: 'Arial', sans-serif; font-size: 24px; letter-spacing: 1px;">B5Tools</h1>
    </div>`;

    // Footer Component
    const footer = `
    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666; font-family: 'Arial', sans-serif;">
        <p style="margin: 5px 0;">© ${new Date().getFullYear()} B5Tools. Todos los derechos reservados.</p>
        <p style="margin: 5px 0;">¿Necesitas ayuda? Responde a este correo.</p>
    </div>`;

    // Welcome Template
    if (type === 'welcome') {
        const statsUrl = `${url || 'https://b5tools.app'}/anotaciongratisbeisbol5`;
        return `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; background-color: #fff;">
            ${header}
            <div style="padding: 40px 30px;">
                <h2 style="color: #111; text-align: center; margin-bottom: 20px; font-size: 22px;">¡Bienvenido a B5Tools! ⚾🖐️</h2>
                
                <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
                    Estamos encantados de que te unas a la plataforma líder para Baseball5. Tu cuenta ya está validada y lista para usar.
                </p>
                
                <p style="color: #444; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Aquí tienes acceso a nuestro suite completo de herramientas profesionales:
                </p>

                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                    <ul style="color: #444; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                        <li><strong>📝 Scorekeeper en Vivo:</strong> Anota partidos play-by-play.</li>
                        <li><strong>📊 Estadísticas:</strong> Generación automática de boxscores.</li>
                        <li><strong>🛡️ Gestión de Clubes:</strong> Administra roster y métricas.</li>
                        <li><strong>🏆 Torneos:</strong> Organiza competiciones oficiales.</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 35px 0;">
                    <a href="${statsUrl}" style="background-color: ${primaryColor}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                        Empezar a Anotar Gratis
                    </a>
                </div>

                <p style="color: #888; font-size: 14px; text-align: center; margin-top: 30px;">
                    Explora todas las funcionalidades iniciando sesión en tu panel.
                </p>
            </div>
            ${footer}
        </div>
        `;
    }

    // Invitation Template
    if (type === 'invite') {
        const roleName = role === 'admin' ? 'Administrador' : 'Árbitro';
        const actionText = role === 'admin' ? 'Gestionar Torneo' : 'Ver Asignaciones';
        const roleColor = role === 'admin' ? '#f59e0b' : '#10b981'; // Orange or Green accent
        const roleIcon = role === 'admin' ? '🛡️' : '⚖️';

        return `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; background-color: #fff;">
            ${header}
            <div style="padding: 40px 30px;">
                <h2 style="color: #111; text-align: center; margin-bottom: 10px;">Invitación Oficial</h2>
                <p style="color: #666; font-size: 16px; text-align: center; margin-top: 0;">
                    Has sido invitado a formar parte del equipo.
                </p>
                
                <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center; border: 1px solid #e2e8f0;">
                    <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Torneo</p>
                    <h3 style="margin: 0 0 20px 0; font-size: 20px; color: #0f172a;">${tournament_name}</h3>
                    
                    <div style="display: inline-block; background-color: ${roleColor}20; color: ${roleColor}; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; border: 1px solid ${roleColor}40;">
                        ${roleIcon} ${roleName}
                    </div>
                </div>

                <p style="color: #444; font-size: 16px; margin-bottom: 30px; text-align: center; line-height: 1.6;">
                    Para aceptar la invitación y comenzar a colaborar, accede a través del siguiente enlace seguro:
                </p>

                <div style="text-align: center; margin-bottom: 40px;">
                    <a href="${url}" style="background-color: ${primaryColor}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                        ${actionText}
                    </a>
                </div>
                
                <p style="text-align: center; font-size: 12px; color: #999; margin-top: 30px;">
                    Si no esperabas esta invitación, puedes ignorar este mensaje.
                </p>
            </div>
            ${footer}
        </div>
        `;
    }
};

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // SMTP Configuration
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');

    // TEST MODE (GET REQUEST): Verify SMTP Credentials directly in Browser
    if (req.method === 'GET') {
        if (!smtpUser || !smtpPass) {
            return new Response(JSON.stringify({ error: "SMTP Credentials Missing in ENV" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        try {
            // Create Transporter for Test
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 465,
                secure: true,
                auth: { user: smtpUser, pass: smtpPass },
            });

            await transporter.verify(); // Authenticate check

            return new Response(
                `✅ SMTP Connection Successful!\nConnected as: ${smtpUser}\nReady to send emails.`,
                { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
            );
        } catch (e: any) {
            return new Response(
                `❌ SMTP Connection Failed:\n${e.message}`,
                { headers: { ...corsHeaders, 'Content-Type': 'text/plain' } }
            );
        }
    }

    // POST Request Handling
    const debugTrace: string[] = [];
    debugTrace.push(`[START] Request received.`);

    try {
        const body = await req.json().catch(err => {
            debugTrace.push(`[ERROR] JSON Parse failed: ${err.message}`);
            throw new Error("Invalid JSON Body");
        });

        let { type, email, role, tournament_name, url, record } = body;

        // Default type logic
        if (!type || type === 'referee' || type === 'admin') type = 'invite';

        // Handle Trigger Payload (User Record) for Welcome Email
        // Supabase database webhook sends data in 'record'
        if (record && record.email) {
            email = record.email;
            type = 'welcome';
            debugTrace.push(`[INFO] Detected Trigger Payload. Switching to Welcome Email.`);
        }

        debugTrace.push(`[INFO] Type: ${type}, Email: ${email}`);

        if (!email) throw new Error('Email is required');

        // Defaults
        if (!url) url = "https://b5tools.app";
        if (!tournament_name) tournament_name = "B5Tools";

        // SMTP Check
        if (!smtpUser || !smtpPass) {
            debugTrace.push(`[WARN] Missing SMTP Credentials.`);
            throw new Error("Server SMTP Misconfiguration");
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
        });

        // Content Generation
        let subject = "";
        let htmlContent = "";

        if (type === 'welcome') {
            subject = "¡Bienvenido a B5Tools! Comienza a anotar ⚾";
            htmlContent = getTemplate('welcome', { url });
        } else {
            subject = `Invitación a B5Tools: ${tournament_name}`;
            htmlContent = getTemplate('invite', { url, role, tournament_name });
        }

        debugTrace.push(`[INFO] Sending mail: ${subject}`);
        const info = await transporter.sendMail({
            from: `"B5Tools" <${smtpUser}>`,
            to: email,
            subject: subject,
            html: htmlContent,
        });

        debugTrace.push(`[SUCCESS] Message sent: ${info.messageId}`);

        return new Response(
            JSON.stringify({
                message: 'Email sent successfully',
                messageId: info.messageId,
                debug_trace: debugTrace
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        debugTrace.push(`[CATCH] Error: ${error.message}`);
        return new Response(
            JSON.stringify({
                error: error.message,
                debug_trace: debugTrace
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
