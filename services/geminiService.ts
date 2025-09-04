import { GoogleGenAI, Modality } from "@google/genai";

const parseDataUrl = (dataUrl: string): { mimeType: string; data: string } => {
  const parts = dataUrl.split(',');
  const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const data = parts[1];
  if (!mimeType || !data) {
    throw new Error('Invalid data URL');
  }
  return { mimeType, data };
};

export const swapJersey = async (playerImageBase64: string, jerseyImageBase64: string, negativePrompt: string, jerseyType: 'Custom Design' | 'Official Jersey'): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const playerImageParts = parseDataUrl(playerImageBase64);
  const jerseyImageParts = parseDataUrl(jerseyImageBase64);

  const customDesignFidelity = `
    *   **LITERAL REPLICATION:** You must transfer every single detail from Image B to the player. This design is a unique concept and must be treated as the absolute source of truth. This includes:
        *   The exact manufacturer logo (e.g., retro Adidas trefoil).
        *   The exact team crest.
        *   The exact sponsor logo.
        *   The precise colors.
        *   Any subtle patterns or textures in the fabric (like the stars in the example).
    *   **DO NOT** use your existing knowledge of team jerseys. Replacing the custom design with a different one from your knowledge is a critical failure.`;

  const officialJerseyFidelity = `
    *   **PERFECT REPLICATION:** You must transfer every single detail from Image B to the player with 100% accuracy. Even though this is an official jersey, the provided image (Image B) is the source of truth for this specific task. Replicate its details exactly, including:
        *   The specific version of the manufacturer logo.
        *   The specific version of the team crest.
        *   The exact sponsor logos and any sleeve patches visible in Image B.
        *   The precise colors and fabric texture from Image B.
    *   **DO NOT** use a generic or different season's version of this jersey from your knowledge base. The goal is to perfectly recreate the jersey shown in Image B on the player in Image A.`;


  const prompt = `**CRITICAL TASK: PHOTOREALISTIC JERSEY REPLACEMENT**

You are a specialist AI for hyper-realistic apparel visualization. Your task is to take a jersey design (Image B) and make a football player (Image A) appear to be naturally wearing it. The result must be photorealistic and indistinguishable from a real photo.

**INPUTS:**
- **Image A (Player Photo):** The target image.
- **Image B (Jersey Design):** The source texture.
- **Jersey Type:** ${jerseyType}

**MANDATORY WORKFLOW:**

1.  **Jersey Area Identification (Masking):**
    *   Analyze Image A and identify the **entire area** of the jersey currently worn by the player.
    *   This is not a rectangle. The area must precisely follow the contours of the player's body: torso, shoulders, arms, sleeves, and collar. Create a perfect mask of this shape.

2.  **Texture Mapping & Warping:**
    *   Treat Image B as a flat texture.
    *   Map and warp this texture onto the masked area of the player. The texture must bend, stretch, and deform naturally with the player's pose and the folds of the fabric.

3.  **Fidelity & Detail Transfer:**
    ${jerseyType === 'Custom Design' ? customDesignFidelity : officialJerseyFidelity}

4.  **Photorealistic Integration (Lighting & Shadows):**
    *   Analyze the lighting (direction, softness, color) in Image A.
    *   Re-apply these lighting conditions to the new jersey.
    *   Re-create the original shadows and fabric folds from Image A onto the new jersey texture to give it volume and realism.
    *   Ensure all other parts of Image A (player's skin, shorts, background) remain completely untouched.

**FAILURE CONDITIONS (WHAT TO AVOID):**
-   Pasting a flat, rectangular patch of the jersey image.
-   The new jersey looking like a sticker or an overlay.
-   Ignoring the player's body shape.
-   Using a different jersey (official or otherwise) from your knowledge base.
-   Mismatched lighting or shadows.
${negativePrompt ? `\n**USER-DEFINED CONSTRAINTS TO AVOID:**\n- ${negativePrompt}` : ''}

**OUTPUT:** The final, edited image ONLY. No text.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          text: prompt,
        },
        {
          inlineData: {
            data: playerImageParts.data,
            mimeType: playerImageParts.mimeType,
          },
        },
        {
          inlineData: {
            data: jerseyImageParts.data,
            mimeType: jerseyImageParts.mimeType,
          },
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("AI failed to generate an image. The response may contain safety blocks or an unexpected format.");
};

export const replaceBackground = async (playerWithNewJerseyBase64: string, newBackgroundBase64: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const playerImageParts = parseDataUrl(playerWithNewJerseyBase64);
  const backgroundImageParts = parseDataUrl(newBackgroundBase64);

  const prompt = `You are a master-level visual effects compositor with an obsessive eye for photorealism. Your mission is to take a player from a source image and flawlessly integrate them into a new background scene. The final result must be indistinguishable from a single, original photograph.

**Source Images:**
- **Player Image:** This is the first image provided. It contains the player you need to extract.
- **Background Image:** This is the second image provided. It is the new scene where the player will be placed.

**Core Objective:** Absolute, undeniable realism. Eradicate any hint of artificiality.

**MANDATORY EXECUTION WORKFLOW:**

1.  **Analyze the Background Image:**
    *   **Lighting Analysis:** Identify the key light source(s). Determine their direction, color temperature (warm/cool), intensity, and quality (hard light with sharp shadows, or soft/diffuse light with gentle shadows). Note any ambient or bounce light.
    *   **Perspective Analysis:** Analyze the perspective lines and vanishing points of the scene. Understand the camera's approximate focal length and angle to establish the scene's scale.

2.  **Prepare the Background Image:**
    *   **Identify Placement Zone:** Determine the most logical position in the background for the player to stand.
    *   **Conditional Removal:** Examine the placement zone. If there is a player who is **in direct conflict** with the new player's position, you will remove them ONLY IF they appear to be a teammate (similar jersey). Flawlessly reconstruct the background behind them.
    *   **Strict Preservation Rule:** You MUST PRESERVE players in the background who are:
        *   Wearing an opponent's jersey (different colors/design).
        *   Significantly out of focus or far in the distance.
        *   Teammates who are not in the direct placement zone.

3.  **Extract and Integrate the Player:**
    *   From the **Player Image**, perfectly isolate the main player, including their entire body and uniform.
    *   Place the isolated player into the identified zone in the **Background Image**.
    *   **CRITICAL SCALING:** You MUST scale the player to be proportionally correct within the scene's perspective. They must not look too big or too small. Their feet must align perfectly with the ground plane. This step is crucial and must be executed with precision.

4.  **Master-Level Lighting and Shadow Synthesis (The Key to Realism):**
    *   **Re-Lighting:** Based on your light analysis, re-light the player. Add highlights (specular and diffuse) that match the new light source's direction and quality.
    *   **Shadow Casting - Non-Negotiable:** Create new shadows that are physically and contextually perfect. This involves two parts:
        *   **Contact Shadows:** Create subtle, dark, soft shadows where the player's feet make contact with the ground. This anchors them to the scene.
        *   **Cast Shadow:** Render the main shadow cast by the player's body. This shadow's **direction** must perfectly oppose the key light source. Its **softness/sharpness** (penumbra) must exactly match the shadows of other objects in the background. Its **color and density** must also match. A blurry, dark blob is an instant failure. The shadow must be a realistic projection of the player's form.

**Final Output:** Produce only the final, perfectly composited image. No text. The result should withstand professional scrutiny.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          text: prompt,
        },
        {
          inlineData: {
            data: playerImageParts.data,
            mimeType: playerImageParts.mimeType,
          },
        },
        {
          inlineData: {
            data: backgroundImageParts.data,
            mimeType: backgroundImageParts.mimeType,
          },
        },
      ],
    },
    config: {
// FIX: Corrected typo from ModITY to Modality.
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64ImageBytes: string = part.inlineData.data;
      const mimeType = part.inlineData.mimeType;
      return `data:${mimeType};base64,${base64ImageBytes}`;
    }
  }

  throw new Error("AI failed to generate an image. The response may contain safety blocks or an unexpected format.");
};