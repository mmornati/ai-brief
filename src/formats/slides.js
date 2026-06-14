import path from 'node:path';
import { getProjectRoot } from '../utils/paths.js';
import { resolveTemplate } from '../templates/resolver.js';
import { readFile, writeFile, mkdir } from '../utils/file.js';

function parseTitle(content, inputFile) {
  const match = content.match(/^# (.+)/m);
  if (match) return match[1].trim();
  if (inputFile) {
    const base = path.basename(inputFile, path.extname(inputFile));
    if (base) return base.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  return 'Untitled';
}

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

function formatSlide(slide) {
  let output = slide.content;
  if (slide.notes.length > 0) {
    const noteLines = slide.notes.map(n => `<!-- speaker: ${n} -->`);
    output += '\n\n' + noteLines.join('\n');
  }
  return output;
}

export async function render(accumulatedContent, metadata = {}) {
  if (typeof accumulatedContent !== 'string' || accumulatedContent.trim().length === 0) {
    throw new Error('Cannot generate slide deck: accumulated content is empty');
  }

  const projectRoot = getProjectRoot();
  const inputName = metadata.inputFile
    ? path.basename(metadata.inputFile, path.extname(metadata.inputFile))
    : 'deck';

  const title = parseTitle(accumulatedContent, metadata.inputFile);
  const { titleSlide, slides } = segmentSlides(accumulatedContent);

  const titleContent = titleSlide ? titleSlide.content.replace(/^# .+\n*/, '').trim() : '';
  let titleSlideText = `# ${title}`;
  if (titleContent) {
    titleSlideText += '\n\n' + titleContent;
  }
  if (titleSlide && titleSlide.notes.length > 0) {
    titleSlideText += '\n\n' + titleSlide.notes.map(n => `<!-- speaker: ${n} -->`).join('\n');
  }

  const bodySlides = slides.map(s => formatSlide(s));
  const allSlides = [titleSlideText, ...bodySlides];
  const deckContent = allSlides.join('\n\n---\n\n');

  let output;
  try {
    const templatePath = await resolveTemplate('slide.md');
    const templateContent = await readFile(templatePath);
    output = templateContent.replace('{{slides}}', deckContent);
  } catch (err) {
    if (!err.message.includes('not found')) throw err;
    output = deckContent;
  }

  const outDir = path.resolve(projectRoot, 'ai-brief-output', 'slides');
  await mkdir(outDir);
  const outPath = path.resolve(outDir, `${inputName}-slides.md`);
  await writeFile(outPath, output);

  return outPath;
}

export default async function orchestrate(accumulatedContent, metadata = {}) {
  return render(accumulatedContent, metadata);
}
