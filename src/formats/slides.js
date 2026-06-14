import { FormatWriter } from './base.js';

function extractSpeakerNote(line) {
  const noteMatch = line.match(/^Note:\s*(.+)/i);
  if (noteMatch) return noteMatch[1].trim();
  const speakerMatch = line.match(/^\[speaker\]:\s*(.+)/i);
  if (speakerMatch) return speakerMatch[1].trim();
  return null;
}

function segmentSlides(content) {
  const lines = content.split('\n');
  const slides = [];
  let currentSlide = [];
  let currentNotes = [];
  let titleSlide = null;
  let foundFirstH2 = false;

  for (const line of lines) {
    const note = extractSpeakerNote(line);
    if (note) {
      currentNotes.push(note);
      continue;
    }

    if (/^##\s/.test(line)) {
      if (!foundFirstH2) {
        titleSlide = { content: currentSlide.join('\n').trim(), notes: [...currentNotes] };
        foundFirstH2 = true;
      } else {
        if (currentSlide.length > 0 || currentNotes.length > 0) {
          slides.push({ content: currentSlide.join('\n').trim(), notes: [...currentNotes] });
        }
      }
      currentSlide = [line];
      currentNotes = [];
    } else {
      currentSlide.push(line);
    }
  }

  if (!foundFirstH2) {
    titleSlide = { content: currentSlide.join('\n').trim(), notes: [...currentNotes] };
  } else {
    if (currentSlide.length > 0 || currentNotes.length > 0) {
      slides.push({ content: currentSlide.join('\n').trim(), notes: [...currentNotes] });
    }
  }

  return { titleSlide, slides };
}

function escapeNote(note) {
  return note.replace(/-->/g, '-- >');
}

function formatSlide(slide) {
  let output = slide.content;
  if (slide.notes.length > 0) {
    const noteLines = slide.notes.map(n => `<!-- speaker: ${escapeNote(n)} -->`);
    output += '\n\n' + noteLines.join('\n');
  }
  return output;
}

class SlidesWriter extends FormatWriter {
  constructor() {
    super('slides', 'slide.md', 'deck');
  }

  async render(accumulatedContent, metadata = {}) {
    if (typeof accumulatedContent !== 'string' || accumulatedContent.trim().length === 0) {
      throw new Error('Cannot generate slide deck: accumulated content is empty');
    }

    const title = this.parseTitle(accumulatedContent, metadata.inputFile);
    const { titleSlide, slides } = segmentSlides(accumulatedContent);

    const titleContent = titleSlide ? titleSlide.content.replace(/^# .+\n*/, '').trim() : '';
    let titleSlideText = `# ${title}`;
    if (titleContent) {
      titleSlideText += '\n\n' + titleContent;
    }
    if (titleSlide && titleSlide.notes.length > 0) {
      titleSlideText += '\n\n' + titleSlide.notes.map(n => `<!-- speaker: ${escapeNote(n)} -->`).join('\n');
    }

    const bodySlides = slides.map(s => formatSlide(s));
    const allSlides = [titleSlideText, ...bodySlides];
    const deckContent = allSlides.join('\n\n---\n\n');

    const templateContent = await this.readTemplate();
    const output = templateContent !== null
      ? templateContent.replaceAll('{{slides}}', deckContent)
      : deckContent;

    return this.writeOutput(metadata.inputFile, output);
  }
}

const writer = new SlidesWriter();

export async function render(accumulatedContent, metadata = {}) {
  return writer.render(accumulatedContent, metadata);
}

export default render;
