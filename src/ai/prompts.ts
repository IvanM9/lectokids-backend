import { GenerateReadingDto } from './ai.dto';
export function generateReading2(params: GenerateReadingDto) {
  return `Generates a reading for a student of ${params.age} years old, who is in ${params.grade}th grade of basic education in a school in Ecuador. This student is ${params.genre == 'm' ? 'a boy' : 'a girl'}.
  This reading must be in Latin American Spanish, it is specific, as it is spoken in Ecuador.
  
  The read is titled "${params.title}" (do not include this title in the generation), and targets: ${params.goals}.
  The read should be of length ${params.length} and divided into multiple pages, as if it were a physical book. Adapt the content and style as follows:

  Student's reading comprehension level that has gone as follows: ${params.comprehensionLevel ?? 'None'}
  Student interests/likes: ${params.interests}
  City where you live: ${params.city}, Ecuador
  Learning problems (if applicable): ${params.problems ?? 'None'}
  Additional preferences: ${params.preferences ?? 'None'}
 
  Reading should be designed to improve the student's reading comprehension (without asking reading comprehension questions), with language appropriate for the student's age and level. Use an engaging and immersive narrative style to keep the student interested. Divide the reading into logical pages, as if it were a physical book.
 
  Returns the reading in a JSON Array with the following structure:
 
  [
    {"content": "string"}
  ]
 
  Important: Only return a single piece of valid JSON text.`;
}
