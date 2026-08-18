from __future__ import annotations

from pathlib import Path
import math
import wave

import numpy as np

SAMPLE_RATE = 44_100
ROOT = Path('/home/ubuntu/space-shooter-engine/assets/astral-bloom/audio')
BGM_DIR = ROOT / 'bgm'
SE_DIR = ROOT / 'se'
BGM_DIR.mkdir(parents=True, exist_ok=True)
SE_DIR.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(2082026)


def hz(midi: float) -> float:
    return 440.0 * (2.0 ** ((midi - 69.0) / 12.0))


def envelope(length: int, attack: float = 0.01, release: float = 0.12) -> np.ndarray:
    attack_samples = min(length, max(1, int(SAMPLE_RATE * attack)))
    release_samples = min(length, max(1, int(SAMPLE_RATE * release)))
    env = np.ones(length, dtype=np.float32)
    env[:attack_samples] = np.linspace(0, 1, attack_samples, dtype=np.float32)
    env[-release_samples:] *= np.linspace(1, 0, release_samples, dtype=np.float32)
    return env


def osc(frequency: float, duration: float, kind: str = 'sine', phase: float = 0.0) -> np.ndarray:
    t = np.arange(int(duration * SAMPLE_RATE), dtype=np.float32) / SAMPLE_RATE
    base = 2 * np.pi * frequency * t + phase
    if kind == 'sine':
        return np.sin(base)
    if kind == 'triangle':
        return (2 / np.pi) * np.arcsin(np.sin(base))
    if kind == 'square':
        return np.sign(np.sin(base))
    if kind == 'saw':
        return 2 * (frequency * t - np.floor(0.5 + frequency * t))
    raise ValueError(kind)


def pan_mono(signal: np.ndarray, pan: float = 0.0) -> np.ndarray:
    left = math.sqrt((1 - pan) / 2)
    right = math.sqrt((1 + pan) / 2)
    return np.column_stack((signal * left, signal * right)).astype(np.float32)


def add(track: np.ndarray, signal: np.ndarray, start_seconds: float, gain: float = 1.0, pan: float = 0.0) -> None:
    start = int(start_seconds * SAMPLE_RATE)
    end = min(track.shape[0], start + signal.shape[0])
    if end <= start:
        return
    track[start:end] += pan_mono(signal[: end - start] * gain, pan)


def bell_note(track: np.ndarray, midi: int, start: float, duration: float, gain: float, pan: float) -> None:
    count = int(duration * SAMPLE_RATE)
    t = np.arange(count, dtype=np.float32) / SAMPLE_RATE
    frequency = hz(midi)
    body = (
        0.62 * np.sin(2 * np.pi * frequency * t)
        + 0.24 * np.sin(2 * np.pi * frequency * 2.01 * t)
        + 0.12 * np.sin(2 * np.pi * frequency * 3.98 * t)
    )
    decay = np.exp(-t * 3.0)
    add(track, body * decay * envelope(count, 0.005, 0.28), start, gain, pan)


def pad(track: np.ndarray, chord: list[int], start: float, duration: float, gain: float) -> None:
    count = int(duration * SAMPLE_RATE)
    t = np.arange(count, dtype=np.float32) / SAMPLE_RATE
    signal = np.zeros(count, dtype=np.float32)
    for index, midi in enumerate(chord):
        frequency = hz(midi)
        detune = 1 + (index - 1) * 0.0028
        signal += 0.18 * np.sin(2 * np.pi * frequency * detune * t)
        signal += 0.055 * np.sin(2 * np.pi * frequency * 2 * t)
    tremolo = 0.82 + 0.18 * np.sin(2 * np.pi * 0.12 * t)
    add(track, signal * tremolo * envelope(count, 0.45, 0.85), start, gain, 0)


def bass_note(track: np.ndarray, midi: int, start: float, duration: float, gain: float) -> None:
    count = int(duration * SAMPLE_RATE)
    t = np.arange(count, dtype=np.float32) / SAMPLE_RATE
    frequency = hz(midi)
    signal = 0.72 * np.sin(2 * np.pi * frequency * t) + 0.18 * np.sin(2 * np.pi * frequency * 2 * t)
    add(track, signal * envelope(count, 0.012, 0.08), start, gain, -0.05)


def kick(track: np.ndarray, start: float, gain: float) -> None:
    length = int(0.24 * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    frequency = 130 * np.exp(-t * 22) + 44
    phase = 2 * np.pi * np.cumsum(frequency) / SAMPLE_RATE
    signal = np.sin(phase) * np.exp(-t * 15)
    add(track, signal, start, gain, 0)


def snare(track: np.ndarray, start: float, gain: float) -> None:
    length = int(0.17 * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = RNG.normal(0, 1, length).astype(np.float32)
    tonal = 0.22 * np.sin(2 * np.pi * 190 * t)
    signal = (noise * 0.78 + tonal) * np.exp(-t * 25)
    add(track, signal, start, gain, 0)


def hat(track: np.ndarray, start: float, gain: float, open_hat: bool = False) -> None:
    length = int((0.15 if open_hat else 0.055) * SAMPLE_RATE)
    t = np.arange(length, dtype=np.float32) / SAMPLE_RATE
    noise = RNG.normal(0, 1, length).astype(np.float32)
    filtered = np.concatenate(([0], np.diff(noise)))
    signal = filtered * np.exp(-t * (18 if open_hat else 72))
    add(track, signal, start, gain, 0.12)


def make_stage_bgm() -> np.ndarray:
    bpm = 132
    beat = 60 / bpm
    bars = 48
    duration = bars * 4 * beat + 2
    track = np.zeros((int(duration * SAMPLE_RATE), 2), dtype=np.float32)
    chords = [([50, 57, 62, 65], 38), ([46, 53, 58, 62], 34), ([41, 48, 53, 57], 29), ([48, 55, 60, 64], 36)]
    arpeggios = [[74, 77, 81, 86, 81, 77, 74, 77], [70, 74, 77, 82, 77, 74, 70, 74], [65, 69, 72, 77, 72, 69, 65, 69], [72, 76, 79, 84, 79, 76, 72, 76]]
    for bar in range(bars):
        start = bar * 4 * beat
        chord, bass = chords[bar % len(chords)]
        pad(track, chord, start, 4 * beat, 0.42)
        for eighth in range(8):
            note = arpeggios[bar % len(arpeggios)][eighth]
            bell_note(track, note, start + eighth * beat / 2, beat * 0.48, 0.22, -0.32 if eighth % 2 == 0 else 0.32)
        for note_index in range(4):
            bass_note(track, bass + (0 if note_index in (0, 2) else 7), start + note_index * beat, beat * 0.72, 0.35)
        for step in range(4):
            kick(track, start + step * beat, 0.48)
            if step in (1, 3): snare(track, start + step * beat, 0.18)
        for step in range(8):
            hat(track, start + step * beat / 2, 0.055 if step % 2 == 0 else 0.035)
        if bar % 8 == 7:
            bell_note(track, 89, start + 3.5 * beat, beat * 0.8, 0.28, 0.0)
    return track


def make_boss_bgm() -> np.ndarray:
    bpm = 150
    beat = 60 / bpm
    bars = 56
    duration = bars * 4 * beat + 2
    track = np.zeros((int(duration * SAMPLE_RATE), 2), dtype=np.float32)
    chords = [([38, 45, 50, 53], 38), ([43, 50, 55, 58], 43), ([41, 48, 53, 57], 41), ([45, 52, 57, 60], 45)]
    sequence = [[74, 77, 81, 86, 84, 81, 77, 74], [79, 82, 86, 89, 86, 82, 79, 77], [77, 81, 84, 89, 86, 84, 81, 77], [81, 84, 88, 91, 88, 84, 81, 79]]
    for bar in range(bars):
        start = bar * 4 * beat
        chord, bass = chords[bar % len(chords)]
        pad(track, chord, start, 4 * beat, 0.5)
        for sixteenth in range(16):
            note = sequence[bar % len(sequence)][sixteenth % 8]
            length = beat * 0.22
            bell_note(track, note, start + sixteenth * beat / 4, length, 0.17, -0.28 if sixteenth % 4 < 2 else 0.28)
        for note_index in range(8):
            bass_note(track, bass + (7 if note_index in (3, 6) else 0), start + note_index * beat / 2, beat * 0.42, 0.40)
        for step in range(8):
            kick(track, start + step * beat / 2, 0.52 if step in (0, 4) else 0.30)
            if step in (2, 6): snare(track, start + step * beat / 2, 0.22)
        for step in range(16):
            hat(track, start + step * beat / 4, 0.045, open_hat=(step % 8 == 7))
        if bar % 4 == 3:
            bell_note(track, 93, start + 3.5 * beat, beat * 1.1, 0.32, 0)
    return track


def chirp(duration: float, start_freq: float, end_freq: float, gain: float, noise: float = 0.0) -> np.ndarray:
    count = int(duration * SAMPLE_RATE)
    t = np.arange(count, dtype=np.float32) / SAMPLE_RATE
    frequency = np.linspace(start_freq, end_freq, count, dtype=np.float32)
    phase = 2 * np.pi * np.cumsum(frequency) / SAMPLE_RATE
    signal = (0.78 * np.sin(phase) + 0.22 * np.sin(phase * 2.02))
    if noise:
        signal += RNG.normal(0, noise, count).astype(np.float32)
    return signal * envelope(count, 0.004, min(0.16, duration * 0.45)) * gain


def make_se() -> dict[str, np.ndarray]:
    sounds: dict[str, np.ndarray] = {}
    sounds['cadenza-shot'] = chirp(0.13, 760, 1260, 0.55)
    sounds['petal-fire'] = chirp(0.23, 340, 720, 0.48, noise=0.025)
    sounds['crystal-break'] = chirp(0.58, 820, 145, 0.65, noise=0.12)
    phase = chirp(0.95, 430, 1720, 0.62, noise=0.04)
    sparkle = chirp(0.36, 1220, 2560, 0.38)
    sounds['flora-phase'] = np.pad(phase, (0, max(0, len(sparkle) - len(phase)))) + np.pad(sparkle, (0, max(0, len(phase) - len(sparkle))))
    sounds['player-hit'] = chirp(0.44, 270, 90, 0.68, noise=0.08)
    sounds['graze'] = chirp(0.085, 1300, 1980, 0.24)
    bomb_a = chirp(1.55, 135, 760, 0.7, noise=0.04)
    bomb_b = chirp(1.55, 300, 1450, 0.38)
    sounds['starlance-bomb'] = bomb_a + bomb_b
    return sounds


def normalise(signal: np.ndarray, peak: float = 0.88) -> np.ndarray:
    max_value = float(np.max(np.abs(signal)))
    return signal if max_value == 0 else signal * (peak / max_value)


def write_wav(path: Path, stereo: np.ndarray) -> None:
    audio = normalise(stereo)
    pcm = (audio * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        output.writeframes(pcm.tobytes())


def main() -> None:
    write_wav(BGM_DIR / 'glassrain-garden.wav', make_stage_bgm())
    write_wav(BGM_DIR / 'flora-orbis.wav', make_boss_bgm())
    for name, sound in make_se().items():
        write_wav(SE_DIR / f'{name}.wav', pan_mono(sound, 0))
    print('Generated procedural ASTRAL BLOOM WAV sources.')


if __name__ == '__main__':
    main()
