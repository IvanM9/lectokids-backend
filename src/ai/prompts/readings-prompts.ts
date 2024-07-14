import {
  GenerateGeneralReadingDto,
  GenerateQuestionsActivitiesDto,
  GenerateReadingDto,
  generateRecommendationForQuestionsActivitiesDto,
} from '../ai.dto';

export function generateReading(params: GenerateGeneralReadingDto) {
  return `You are an educational content generator.
  Write a reading passage in Spanish (Ecuadorian) suitable for school children to practice reading comprehension. The reading passage should be based on the following parameters:

- Title (do not include this title in the generation): "${params.title}"
- Objectives: "${params.goals}"
- Length: "${params.length}"
- Extra details: "${params.customPrompt}"

The passage should be engaging and educational, with clear and simple language appropriate for children. The output should be formatted as a JSON array where each item represents a page in the book.
Do not include markdown formatting within the contents.
Output format:

  { contents: [ { "content": "string" } ] }

 Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax. 
 Example Output:
 {
    contents:
    [
      { "content": "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas." },
      { "content": "Los habitantes del pueblo estaban emocionados por las noticias del forastero y se reunieron en la plaza para escucharlo." },
      { "content": "El forastero les contó sobre las tierras lejanas y las maravillas que había visto en su viaje." }
    ]
  }`;
}

export function generateReading2(params: GenerateReadingDto) {
  return `You are an educational content generator. 
  Generates a reading for a student of ${params.age} years old, who is in ${params.grade}th grade of basic education in a school in Ecuador. This student is ${params.genre == 'm' ? 'a boy' : 'a girl'}.
  This reading must be in Latin American Spanish, it is specific, as it is spoken in Ecuador.
  
  The read is titled "${params.title}" (do not include this title in the generation), and targets: '${params.goals}'.
  The read should be of length ${params.length} and divided into multiple pages, as if it were a physical book. Adapt the content and style as follows (remember that these parameters are in Spanish):

  Student interests/likes: '${params.interests}'
  City where you live: ${params.city}, Ecuador
  ${params.problems ? 'Learning problems: "' + params.problems + '".' : ''}
  ${params.preferences ? 'Additional preferences: "' + params.preferences + '".' : ''}

  ${params.customPrompt ? 'Also, take into account this personalization of the reading: "' + params.customPrompt + '"' : ''}
  Reading should be designed to improve the student's reading comprehension (without asking reading comprehension questions), with language appropriate for the student's age and level. Use an engaging and immersive narrative style to keep the student interested. Divide the reading into logical pages, as if it were a physical book.
 
  Returns the reading in a JSON Array with the following structure:
 
  { contents: [ { "content": "string" } ] }
 
  Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.
  Do not include markdown formatting within the contents.
  Example Output:
  {
    contents:
    [
      { "content": "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas." },
      { "content": "Los habitantes del pueblo estaban emocionados por las noticias del forastero y se reunieron en la plaza para escucharlo." },
      { "content": "El forastero les contó sobre las tierras lejanas y las maravillas que había visto en su viaje." }
    ]
  }
    `;
}

export function generateQuiz(params: GenerateQuestionsActivitiesDto) {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with multiple-choice questions and answers for reading comprehension. Ensure that the questions and answers are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

  { 
    questions: [
      {
        "question": "string",
        "answers": [
          {
            "answer": "string",
            "isCorrect": "boolean"
          }
        ]
      }
    ]
  }

Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.

Here is the information you need:

Reading Passage: "${params.reading}"
Student Age: ${params.age}
Grade Level: ${params.grade}

Generate 3-5 comprehension questions and multiple-choice answers based on the reading passage. Make sure the questions and answers are clear, concise, and age-appropriate.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:

{
  "questions": [
      {
        "question": "¿Cómo eran los habitantes del pequeño pueblo?",
        "answers": [
          {
            "answer": "Eran muy amables y trabajadores.",
            "isCorrect": true
          },
          {
            "answer": "Eran muy perezosos.",
            "isCorrect": false
          },
          {
            "answer": "Eran muy ricos.",
            "isCorrect": false
          }
        ]
      },
      {
        "question": "¿Quién llegó al pueblo un día?",
        "answers": [
          {
            "answer": "Un forastero.",
            "isCorrect": true
          },
          {
            "answer": "Un amigo.",
            "isCorrect": false
          },
          {
            "answer": "Un niño.",
            "isCorrect": false
          }
        ]
      }
  ]
}
`;
}

export function generateYesOrNot(params: GenerateQuestionsActivitiesDto) {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with true or false questions for reading comprehension. Ensure that the questions are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

  {
    "questions": [
      {
        "question": "string",
        "answers": [
          {
            "answer": "verdadero" or "falso",
            "isCorrect": true
          }
        ]
      }
    ]
  }

Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.

Here is the information you need:

Reading Passage: "${params.reading}"
Student Age: ${params.age}
Grade Level: ${params.grade}

Generate 3-5 true or false comprehension questions based on the reading passage. Make sure the questions are clear, concise, and age-appropriate. Each answer should be either "verdadero" or "falso" with the "isCorrect" field set to true.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:

{
  "questions": [
      {
        "question": "¿Todos los habitantes del pequeño pueblo eran muy amables y trabajadores?",
        "answers": [
          {
            "answer": "verdadero",
            "isCorrect": true
          }
        ]
      },
      {
        "question": "¿Un forastero llegó al pueblo y trajo consigo noticias de tierras cercanas?",
        "answers": [
          {
            "answer": "falso",
            "isCorrect": true
          }
        ]
      }
  ]
}
`;
}

export function generateOpenText(params: GenerateQuestionsActivitiesDto) {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with one Free Text Question that allows the student to freely write about the reading passage. Make sure the question is appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

  { 
   "questions": [
        {
          "question": "string"
        }
    ]
  }

Here is the information you need:

Reading Passage: "${params.reading}"
Student Age: ${params.age}
Grade Level: ${params.grade}

Generate one free text question based on the reading passage. Make sure the question is clear, concise, and age-appropriate.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:

{ "questions": 
  [
      {
        "question": "Según lo que recuerdas de la lectura, reescribe la historia de una manera diferente."
      }
  ]
}
`;
}

export function generateOpenAnswers(params: GenerateQuestionsActivitiesDto) {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with open-ended questions for reading comprehension. Ensure that the questions are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

  { 
    "questions": [
      {
        "question": "string"
      }
    ]
  }

Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.

Here is the information you need:

Reading Passage: "${params.reading}"
Student Age: ${params.age}
Grade Level: ${params.grade}

Generate 3-5 open-ended comprehension questions based on the reading passage. Make sure the questions are clear, concise, and age-appropriate.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:

{ 
  "questions": [
      {
        "question": "¿Cómo eran los habitantes del pequeño pueblo?"
      },
      {
        "question": "¿Qué trajo consigo el forastero que llegó al pueblo?"
      },
      {
        "question": "Describe al forastero que llegó al pueblo."
      }
  ]
}
`;
}

export function generateAlphabetSoup(params: GenerateQuestionsActivitiesDto) {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with words that should be found in a word search puzzle. Ensure that the words are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

  { 
    "questions": [
      {
        "question": "Encuentra las siguientes palabras en la sopa de letras:",
        "answers": [
          {
            "answer": "string",
            "isCorrect": true
          },
          {
            "answer": "string",
            "isCorrect": true
          },
          {
            "answer": "string",
            "isCorrect": true
          }
        ]
      }
    ]
  }

Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.

Here is the information you need:

Reading Passage: "${params.reading}"
Student Age: ${params.age}
Grade Level: ${params.grade}

Generate a list of 3-5 words that can be found in a word search puzzle based on the reading passage. Make sure the words are clear, concise, and age-appropriate.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:

{ 
  "questions": [
    {
      "question": "Encuentra las siguientes palabras en la sopa de letras:",
      "answers": [
        {
          "answer": "pueblo",
          "isCorrect": true
        },
        {
          "answer": "forastero",
          "isCorrect": true
        },
        {
          "answer": "noticias",
          "isCorrect": true
        }
      ]
    }
  ]
}
`;
}

export function getTypeActivities(params: GenerateQuestionsActivitiesDto) {
  return `You are an educational content planner. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, determine the types of activities that are appropriate for the student's comprehension and engagement. The types of activities are: YES_NO (True or False), QUIZ (Multiple Choice), OPEN_ANSWERS (Open-ended Questions), OPEN_TEXT (Free Text Question), ALPHABET_SOUP (Word Search), CROSSWORD. The output should be in JSON format as follows:

  { "typeActivities" : [ { "activityType": "string" } ] }

Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.

Here is the information you need:

Reading Passage: "${params.reading}"
Student Age: ${params.age}
Grade Level: ${params.grade}

Based on the provided information, determine and list the suitable activity types for the student's age and grade level. Ensure the activities are engaging and appropriate for the given context.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:
{ 
  "typeActivities" : [
      {
        "activityType": "YES_NO"
      },
      {
        "activityType": "QUIZ"
      },
      {
        "activityType": "OPEN_TEXT"
      },
      {
        "activityType": "ALPHABET_SOUP"
      }
  ]
}
`;
}

export function generateCrossword(params: GenerateQuestionsActivitiesDto) {
  return `You are an educational assistant tasked with creating a crossword puzzle to help a school child improve their reading comprehension. Based on the provided reading text, generate a list of 3-6 words that can be used in the crossword. Each word should be relevant to the text. The output should be in Spanish (Ecuadorian). Also, consider the child's age and grade when selecting the words to ensure they are appropriate.

Parameters:
- Reading text: "${params.reading}"
- Student Age: ${params.age}
- Grade Level: ${params.grade}

Output format (in JSON):

{ 
  "questions": [
    {
      "question": "string",
      "answers": [
        {
          "answer": "string",
          "isCorrect": true
        }
      ]
    }
  ]
}

Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.

Example:
Input:
Reading text: "Los animales del bosque se preparan para el invierno. El oso recolecta bayas, el zorro construye su madriguera y el ciervo busca un lugar seguro."
Student Age: 10
Grade Level: 4

Example output:

{ 
  "questions": [
    {
      "question": "oso",
      "answers": [
        {
          "answer": "Animal que recolecta bayas",
          "isCorrect": true
        }
      ]
    },
    {
      "question": "zorro",
      "answers": [
        {
          "answer": "Animal que construye su madriguera",
          "isCorrect": true
        }
      ]
    },
    {
      "question": "ciervo",
      "answers": [
        {
          "answer": "Animal que busca un lugar seguro",
          "isCorrect": true
        }
      ]
    }
  ]
}
`;
}

export function generateRecommendationForQuestionsActivities(
  params: generateRecommendationForQuestionsActivitiesDto,
) {
  return `I will provide a reading passage, a question about the passage, and the student's answer. Please evaluate the student's answer and provide feedback in JSON format. The feedback should be written in easy-to-understand Spanish (Ecuadorian) for a school student. The JSON format should be:

{
  "recommendation": "string"
}
  
Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.

Here is the reading passage, the question, and the student's answer:

Reading Passage: "${params.reading}"

Question: "${params.question}"

Student's Answer: "${params.answer}"`;
}

export function generateVerificationOpenAnswers(
  params: generateRecommendationForQuestionsActivitiesDto,
) {
  return `You are a helpful assistant tasked with evaluating the accuracy of a student's open-ended response to a question based on a given reading passage. The goal is to determine if the student's answer correctly addresses the question using information from the reading. Your response should be in the format: { \"isCorrect\": \"boolean\" }. Here is the reading passage:

"${params.reading}"

Question: "${params.question}"

Student's Response: "${params.answer}"

Based on the information in the reading passage, is the student's response correct?
Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.`;
}

export function generateReadingInformation() {
  return `
  Generate a title for a reading passage and its learning objectives. The passage is intended for school students to practice reading comprehension, which will later be assessed through comprehension activities. The title should be engaging and appropriate for school-age children. The objectives should focus on specific reading comprehension skills such as identifying main ideas, understanding vocabulary in context, or making inferences.
Provide the output in the following JSON format:
{
  "title": "string",
  "objectives": "string"
}

The 'title' should be a single, concise string. The 'objectives' should be a single string containing 2-3 clear, measurable learning objectives separated by semicolons.
Example output:
{
  "title": "The Mysterious Garden",
  "objectives": "Identify the main characters and their roles; Understand the sequence of events in the story; Make predictions about what might happen next based on given information"
}

Important: Only return a single piece of valid JSON text. Return it as text, not block code syntax.
Please generate a new, unique title and set of objectives following this format.
This generated content must be in Ecuadorian Spanish`;
}
