// netlify/functions/hotmart-user.js

export const handler = async (event, context) => {
  try {
    const payload = JSON.parse(event.body || "{}");

    // Verifica evento do Hotmart
    const eventType = payload.event || payload.event_type || "";

    if (!eventType.includes("approved")) {
      return {
        statusCode: 200,
        body: "Evento ignorado: " + eventType,
      };
    }

    const email = payload.data?.buyer?.email;
    const nome = payload.data?.buyer?.name || "Comprador Hotmart";

    if (!email) {
      return { statusCode: 400, body: "Erro: sem e-mail no payload" };
    }

    // URL da API do Identity (variável criada no Netlify)
    const identityUrl = process.env.IDENTITY_URL;
    const adminToken = process.env.NETLIFY_IDENTITY_TOKEN;

    const resp = await fetch(`${identityUrl}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + adminToken,
      },
      body: JSON.stringify({
        email,
        user_metadata: { nome },
        invite: true, // envia e-mail automático para criar senha
      }),
    });

    const result = await resp.json();

    if (!resp.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Erro ao criar usuário",
          details: result,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Usuário criado com sucesso",
        email,
        result,
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: "Erro interno: " + error.message,
    };
  }
};
