import { GenerateReadingDto } from './ai.dto';

export function generateReading(params: GenerateReadingDto) {
  return `Genera una lectura para un estudiante de ${params.age} años, que está en ${params.grade} de educación básica en una escuela del Ecuador. Este estudiante es ${params.genre == 'm' ? 'un niño' : 'una niña'}.
  La lectura está titulada como "${params.title}" (no incluyas este título en la generación), con el objetivo de ${params.goals}. La lectura debe ser de longitud ${params.lenght} y dividirse en varias páginas, como si fuera un libro físico. Adapta el contenido y estilo de la siguiente manera:

  Nivel de comprensión lectora del estudiante que ha ido de la siguiente manera: ${params.comprensionLevel ?? 'Ninguno'}
  Intereses/gustos del estudiante: ${params.interests}
  Ciudad donde vive: ${params.city}, Ecuador
  Problemas de aprendizaje (si aplica): ${params.problems ?? 'Ninguno'}
  Preferencias adicionales: ${params.preferences ?? 'Ninguna'}
  
  La lectura debe estar diseñada para mejorar la comprensión lectora del estudiante (sin hacerle preguntas de compresión lectora), con un lenguaje apropiado para su edad y nivel. Utiliza un estilo narrativo atractivo y envolvente para mantener al estudiante interesado. Divide la lectura en páginas lógicas, como si fuera un libro físico.`;
}
