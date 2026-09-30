type WhatsAppSendResult = {
    success: boolean;
    messageId?: string;
    error?: string;
  };
  
  export async function sendWhatsAppMessage(
    to: string,
    message: string
  ): Promise<WhatsAppSendResult> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
    if (!accessToken) {
      return {
        success: false,
        error: "WHATSAPP_ACCESS_TOKEN is not configured.",
      };
    }
  
    if (!phoneNumberId) {
      return {
        success: false,
        error: "WHATSAPP_PHONE_NUMBER_ID is not configured.",
      };
    }
  
    const normalizedTo = to.replace(/[^\d]/g, "");
  
    if (!normalizedTo) {
      return {
        success: false,
        error: "A valid recipient phone number is required.",
      };
    }
  
    try {
      const response = await fetch(
        `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalizedTo,
            type: "text",
            text: {
              preview_url: false,
              body: message,
            },
          }),
        }
      );
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error("WhatsApp API error:", data);
  
        return {
          success: false,
          error:
            data?.error?.message ||
            "WhatsApp API returned an error.",
        };
      }
  
      return {
        success: true,
        messageId: data?.messages?.[0]?.id,
      };
    } catch (error) {
      console.error("WhatsApp send error:", error);
  
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send WhatsApp message.",
      };
    }
  }