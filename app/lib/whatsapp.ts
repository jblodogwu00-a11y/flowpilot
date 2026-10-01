export type WhatsAppAttachment = {
  filename: string;
  mimeType: string | null;
  content: Buffer;
};

type WhatsAppSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

type WhatsAppMediaType =
  | "image"
  | "video"
  | "audio"
  | "document";

function getMediaType(
  mimeType: string | null
): WhatsAppMediaType {
  const mime = (mimeType || "").toLowerCase();

  if (mime.startsWith("image/")) {
    return "image";
  }

  if (mime.startsWith("video/")) {
    return "video";
  }

  if (mime.startsWith("audio/")) {
    return "audio";
  }

  return "document";
}

async function uploadWhatsAppMedia(
  attachment: WhatsAppAttachment,
  accessToken: string,
  phoneNumberId: string
): Promise<{
  success: boolean;
  mediaId?: string;
  error?: string;
}> {
  try {
    const formData = new FormData();

    formData.append(
      "messaging_product",
      "whatsapp"
    );

    const mimeType =
      attachment.mimeType ||
      "application/octet-stream";

    /*
     * Convert Node Buffer into a proper
     * ArrayBuffer before creating the Blob.
     *
     * This avoids the TypeScript Buffer/Blob
     * compatibility error on Windows.
     */
    const arrayBuffer =
      attachment.content.buffer.slice(
        attachment.content.byteOffset,
        attachment.content.byteOffset +
          attachment.content.byteLength
      ) as ArrayBuffer;

    const blob = new Blob(
      [arrayBuffer],
      {
        type: mimeType,
      }
    );

    formData.append(
      "file",
      blob,
      attachment.filename
    );

    formData.append(
      "type",
      mimeType
    );

    const response =
      await fetch(
        `https://graph.facebook.com/v25.0/${phoneNumberId}/media`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "WhatsApp media upload error:",
        data
      );

      return {
        success: false,
        error:
          data?.error?.message ||
          "WhatsApp media upload failed.",
      };
    }

    if (!data?.id) {
      return {
        success: false,
        error:
          "WhatsApp did not return a media ID.",
      };
    }

    return {
      success: true,
      mediaId: data.id,
    };
  } catch (error) {
    console.error(
      "WhatsApp media upload error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload WhatsApp media.",
    };
  }
}

async function sendWhatsAppMedia(
  to: string,
  mediaType: WhatsAppMediaType,
  mediaId: string,
  filename: string | null,
  caption: string | null,
  accessToken: string,
  phoneNumberId: string
): Promise<WhatsAppSendResult> {
  try {
    const media: Record<
      string,
      string
    > = {
      id: mediaId,
    };

    /*
     * Documents support a filename.
     */
    if (
      mediaType === "document" &&
      filename
    ) {
      media.filename = filename;
    }

    /*
     * Image, video and document
     * messages can have captions.
     */
    if (
      caption &&
      (
        mediaType === "image" ||
        mediaType === "video" ||
        mediaType === "document"
      )
    ) {
      media.caption = caption;
    }

    const response =
      await fetch(
        `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            messaging_product:
              "whatsapp",
            recipient_type:
              "individual",
            to,
            type: mediaType,
            [mediaType]: media,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "WhatsApp media message error:",
        data
      );

      return {
        success: false,
        error:
          data?.error?.message ||
          "WhatsApp media message failed.",
      };
    }

    return {
      success: true,
      messageId:
        data?.messages?.[0]?.id,
    };
  } catch (error) {
    console.error(
      "WhatsApp media message error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send WhatsApp media.",
    };
  }
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  attachments: WhatsAppAttachment[] = []
): Promise<WhatsAppSendResult> {
  const accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN;

  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken) {
    return {
      success: false,
      error:
        "WHATSAPP_ACCESS_TOKEN is not configured.",
    };
  }

  if (!phoneNumberId) {
    return {
      success: false,
      error:
        "WHATSAPP_PHONE_NUMBER_ID is not configured.",
    };
  }

  const normalizedTo =
    to.replace(/[^\d]/g, "");

  if (!normalizedTo) {
    return {
      success: false,
      error:
        "A valid recipient phone number is required.",
    };
  }

  try {
    /*
     * No attachments:
     * send a normal WhatsApp text.
     */
    if (attachments.length === 0) {
      const response =
        await fetch(
          `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              messaging_product:
                "whatsapp",
              recipient_type:
                "individual",
              to: normalizedTo,
              type: "text",
              text: {
                preview_url: false,
                body: message,
              },
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "WhatsApp API error:",
          data
        );

        return {
          success: false,
          error:
            data?.error?.message ||
            "WhatsApp API returned an error.",
        };
      }

      return {
        success: true,
        messageId:
          data?.messages?.[0]?.id,
      };
    }

    /*
     * With attachments:
     * send the automation text first.
     */
    if (message.trim()) {
      const textResponse =
        await fetch(
          `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              messaging_product:
                "whatsapp",
              recipient_type:
                "individual",
              to: normalizedTo,
              type: "text",
              text: {
                preview_url: false,
                body: message,
              },
            }),
          }
        );

      const textData =
        await textResponse.json();

      if (!textResponse.ok) {
        console.error(
          "WhatsApp text message error:",
          textData
        );

        return {
          success: false,
          error:
            textData?.error?.message ||
            "WhatsApp text message failed.",
        };
      }
    }

    let lastMessageId:
      | string
      | undefined;

    /*
     * Upload and send each attachment.
     */
    for (
      const attachment of attachments
    ) {
      const uploadResult =
        await uploadWhatsAppMedia(
          attachment,
          accessToken,
          phoneNumberId
        );

      if (
        !uploadResult.success ||
        !uploadResult.mediaId
      ) {
        return {
          success: false,
          error:
            uploadResult.error ||
            `Failed to upload ${attachment.filename}.`,
        };
      }

      const mediaType =
        getMediaType(
          attachment.mimeType
        );

      /*
       * The text has already been sent,
       * so we don't duplicate it as a caption.
       */
      const mediaResult =
        await sendWhatsAppMedia(
          normalizedTo,
          mediaType,
          uploadResult.mediaId,
          attachment.filename,
          null,
          accessToken,
          phoneNumberId
        );

      if (!mediaResult.success) {
        return {
          success: false,
          error:
            mediaResult.error ||
            `Failed to send ${attachment.filename}.`,
        };
      }

      lastMessageId =
        mediaResult.messageId;
    }

    return {
      success: true,
      messageId: lastMessageId,
    };
  } catch (error) {
    console.error(
      "WhatsApp send error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to send WhatsApp message.",
    };
  }
}