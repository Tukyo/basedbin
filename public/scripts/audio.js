let nextAudioTrack = null;
let isLooping = true;
// #region Initialization
const bgmWaveSurfer = WaveSurfer.create({
    container: document.createElement('div'), // Invisible container
    waveColor: 'transparent',
    progressColor: 'transparent',
    interact: false
});
// #endregion Initialization
////
const track = '../assets/audio/theme.mp3';
// #region Playback
/// PLAY
function startLoop(audioTrack) {
    if (bgmWaveSurfer.isPlaying()) { bgmWaveSurfer.stop(); }

    bgmWaveSurfer.load(audioTrack);
    bgmWaveSurfer.on('ready', () => {
        bgmWaveSurfer.play();
        console.log(`Playing new track: ${audioTrack}`);
    });
    bgmWaveSurfer.on('finish', () => {
        if (nextAudioTrack) {
            console.log(`Playing queued track: ${nextAudioTrack}`);
            const queuedTrack = nextAudioTrack;
            nextAudioTrack = null; // Clear the queue
            startLoop(queuedTrack);
        } else if (isLooping) {
            console.log(`Looping track: ${audioTrack}`);
            bgmWaveSurfer.play();
        }
    });
}
function stopLoop() { bgmWaveSurfer.stop(); }
////
// #region Note Playback
noteBuffer = [];
maxNoteBuffer = 20;
let justPlayed = false;
function playNote(note) {
    if (justPlayed) { return; }
    if (noteBuffer.length > maxNoteBuffer) { const oldestWaveSurfer = noteBuffer.shift(); oldestWaveSurfer.destroy(); return; }

    justPlayed = true;
    setTimeout(() => { justPlayed = false; }, 50);

    const noteWaveSurfer = WaveSurfer.create({
        container: document.createElement('div'),
        waveColor: 'transparent',
        progressColor: 'transparent',
        interact: false
    });
    noteBuffer.push(noteWaveSurfer);

    noteWaveSurfer.load(note);
    noteWaveSurfer.on('ready', () => {
        console.log(`Playing note: ${note}`);
        noteWaveSurfer.play();
    });

    noteWaveSurfer.on('finish', () => {
        console.log(`Finished playing note: ${note}`);
        noteWaveSurfer.destroy();

        const index = noteBuffer.indexOf(noteWaveSurfer);
        if (index !== -1) {
            noteBuffer.splice(index, 1);
        }
    });
}
// #endregion Note Playback