export function generateFrontPagePrompt(reading: string) {
  return `Create a colorful and engaging cover illustration for a children's storybook designed for elementary school students practicing reading comprehension. The cover should include key elements and themes from the following story excerpt:

Story Excerpt:
"${reading}"

Additional Details:

- The illustration should be vibrant and appealing to young children.
- Include friendly and playful characters, scenes, and objects mentioned in the story excerpt.
- Ensure the illustration conveys a sense of adventure, curiosity, and learning.
- Use bright and cheerful colors to capture the attention of young readers.

Important: Do not insert text anywhere in the image.`;
}

export function generatePromptForFrontPage(reading: string) {
  return `
  Generate a detailed prompt for DALL-E to create a cover illustration for a children's storybook. The illustration should be based on a story provided separately. The generated prompt should describe the key characteristics and elements necessary for creating the cover image without explicitly including the full text of the story.

Here are the necessary characteristics to include:

- Describe the overall theme and tone of the story (e.g., adventure, friendship, learning).
- Mention the main characters and any distinctive features or items they might have.
- Highlight key scenes or settings that should be included in the illustration.
- Specify the type of colors and artistic style suitable for young children (e.g., bright colors, cartoonish style).

Provide the generated prompt in English. Just generate the prompt.
Important: The prompt must specify that no text is included in the image

Story Excerpt:
'${reading}'
`;
}
