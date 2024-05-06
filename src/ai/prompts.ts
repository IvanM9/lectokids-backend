import { GenerateReadingDto } from './ai.dto';

export function generateReading(params: GenerateReadingDto) {
  return `Genera una lectura para un estudiante de ${params.age} años, que está en ${params.grade}° grado de educación básica en una escuela del Ecuador. Este estudiante es ${params.genre == 'm' ? 'un niño' : 'una niña'}.
  La lectura está titulada como "${params.title}" (no incluyas este título en la generación), y tiene como objetivo: ${params.goals}. 
  La lectura debe ser de longitud ${params.lenght} y dividirse en varias páginas, como si fuera un libro físico. Adapta el contenido y estilo de la siguiente manera:

  Nivel de comprensión lectora del estudiante que ha ido de la siguiente manera: ${params.comprensionLevel ?? 'Ninguno'}
  Intereses/gustos del estudiante: ${params.interests}
  Ciudad donde vive: ${params.city}, Ecuador
  Problemas de aprendizaje (si aplica): ${params.problems ?? 'Ninguno'}
  Preferencias adicionales: ${params.preferences ?? 'Ninguna'}
  
  La lectura debe estar diseñada para mejorar la comprensión lectora del estudiante (sin hacerle preguntas de compresión lectora), con un lenguaje apropiado para su edad y nivel. Utiliza un estilo narrativo atractivo y envolvente para mantener al estudiante interesado. Divide la lectura en páginas lógicas, como si fuera un libro físico.
  También quiero que los separadores de páginas sólo digan "Página" y no incluyas el número de la página. Por ejemplo, si la lectura tiene 5 páginas, los separadores deben decir "Página", "Página", "Página", "Página", "Página". Además, la palabra "Página" no debe estar en negrita, ni tener salto de línea antes o después de ella.`;
}

export function generateReading2(params: GenerateReadingDto) {
  return `Genera una lectura para un estudiante de ${params.age} años, que está en ${params.grade}° grado de educación básica en una escuela del Ecuador. Este estudiante es ${params.genre == 'm' ? 'un niño' : 'una niña'}.
  La lectura está titulada como "${params.title}" (no incluyas este título en la generación), y tiene como objetivo: ${params.goals}. 
  La lectura debe ser de longitud ${params.lenght} y dividirse en varias páginas, como si fuera un libro físico. Adapta el contenido y estilo de la siguiente manera:

  Nivel de comprensión lectora del estudiante que ha ido de la siguiente manera: ${params.comprensionLevel ?? 'Ninguno'}
  Intereses/gustos del estudiante: ${params.interests}
  Ciudad donde vive: ${params.city}, Ecuador
  Problemas de aprendizaje (si aplica): ${params.problems ?? 'Ninguno'}
  Preferencias adicionales: ${params.preferences ?? 'Ninguna'}
  
  La lectura debe estar diseñada para mejorar la comprensión lectora del estudiante (sin hacerle preguntas de compresión lectora), con un lenguaje apropiado para su edad y nivel. Utiliza un estilo narrativo atractivo y envolvente para mantener al estudiante interesado. Divide la lectura en páginas lógicas, como si fuera un libro físico.
  
  Devuelve la lectura en un JSON con la siguiente estructura (estríctamente que sea JSON):
  {
  "lectura": [
  "Página 1 del contenido de la lectura",
  "Página 2 del contenido de la lectura",
  ...
  ]
  }
  
  No incluyas la palabra "Página" en cada elemento del array, sólo el contenido de la página. `;
}
