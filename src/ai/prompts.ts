import { GenerateReadingDto } from './ai.dto';
export function generateReading2(params: GenerateReadingDto) {
  return `Generates a reading for a student of ${params.age} years old, who is in ${params.grade}th grade of basic education in a school in Ecuador. This student is ${params.genre == 'm' ? 'a boy' : 'a girl'}.
  This reading must be in Latin American Spanish, it is specific, as it is spoken in Ecuador.
  
  The read is titled "${params.title}" (do not include this title in the generation), and targets: ${params.goals}.
  The read should be of length ${params.length} and divided into multiple pages, as if it were a physical book. Adapt the content and style as follows (remember that these parameters are in Spanish):

  Student's reading comprehension level that has gone as follows: ${params.comprehensionLevel ?? 'None'}
  Student interests/likes: '${params.interests}'
  City where you live: ${params.city}, Ecuador
  Learning problems (if applicable): '${params.problems ?? 'None'}'
  Additional preferences: '${params.preferences ?? 'None'}'
 

  Also, take into account this personalization of the reading (if applicable): '${params.customPrompt ?? 'None'}'
  Reading should be designed to improve the student's reading comprehension (without asking reading comprehension questions), with language appropriate for the student's age and level. Use an engaging and immersive narrative style to keep the student interested. Divide the reading into logical pages, as if it were a physical book.
 
  Returns the reading in a JSON Array with the following structure:
 
  [
    {"content": "string"}
  ]
 
  Important: Only return a single piece of valid JSON text.`;
}

export function generateQuiz() {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with multiple-choice questions and answers for reading comprehension. Ensure that the questions and answers are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

[
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

Here is the information you need:

Reading Passage: [Insert the reading passage here]
Student Age: [Insert the age here]
Grade Level: [Insert the grade level here]

Generate 3-5 comprehension questions and multiple-choice answers based on the reading passage. Make sure the questions and answers are clear, concise, and age-appropriate.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:
[
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
`;
}

export function generateYesOrNot() {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with true or false questions for reading comprehension. Ensure that the questions are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

[
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

Here is the information you need:

Reading Passage: [Insert the reading passage here]
Student Age: [Insert the age here]
Grade Level: [Insert the grade level here]

Generate 3-5 true or false comprehension questions based on the reading passage. Make sure the questions are clear, concise, and age-appropriate. Each answer should be either "verdadero" or "falso" with the "isCorrect" field set to true.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:
[
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
`;
}

export function generateOpenText() {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with open-ended questions for reading comprehension. Ensure that the questions are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

[
    {
      "question": "string"
    }
]

Here is the information you need:

Reading Passage: [Insert the reading passage here]
Student Age: [Insert the age here]
Grade Level: [Insert the grade level here]

Generate 3-5 open-ended comprehension questions based on the reading passage. Make sure the questions are clear, concise, and age-appropriate.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:
[
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
`;
}

export function generateAlphabetSoup() {
  return `You are an educational content generator. I will provide you with a reading passage, the age of the student, and the grade level. Based on this information, generate a JSON output with words that should be found in a word search puzzle. Ensure that the words are appropriate for the given age and grade level. The output should be in Ecuadorian Spanish and follow this JSON format:

[
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

Here is the information you need:

Reading Passage: [Insert the reading passage here]
Student Age: [Insert the age here]
Grade Level: [Insert the grade level here]

Generate a list of 3-5 words that can be found in a word search puzzle based on the reading passage. Make sure the words are clear, concise, and age-appropriate.

Example Input:
Reading Passage: "Había una vez un pequeño pueblo donde todos los habitantes eran muy amables y trabajadores. Un día, un forastero llegó al pueblo y trajo consigo noticias de tierras lejanas."
Student Age: 10
Grade Level: 4

Example Output:
[
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
`;
}
