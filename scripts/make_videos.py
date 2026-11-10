from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
assets = root / 'dist/assets'
(root / 'build').mkdir(exist_ok=True)
scenes = {
    'gtm-production': [
        ('plasmid-afm.jpg', 'Генетикалық өзгеріс', 'ДНҚ-дағы өзгеріс жасушаның қасиетіне әсер етеді.'),
        ('ecoli-ars.jpg', 'Микроорганизм', 'Инженерлік штамм қажетті өнімді синтездейді.'),
        ('bioreactor.jpg', 'Жабық өндіріс', 'Жасушалар бақыланатын биореакторда өсіріледі.'),
        ('insulin.jpg', 'Тазартылған өнім', 'Инсулин өндірісінде жасушалар мен өнім бөлінеді.')
    ],
    'ai-petase': [
        ('petase.jpeg', 'ЖИ көмегімен ферментті зерттеу', 'Модель ықтимал өзгерістерді іріктеуге көмектеседі.'),
        ('dna-structure.jpeg', 'Ұсыныс пен тәжірибе', 'Болжанған нұсқаның қасиетін зертханада тексереді.'),
        ('petase.jpeg', 'PET-ті ферментпен ыдырату', 'FAST-PETase бақыланатын ортада зерттелді.'),
        ('bioreactor.jpg', 'Нәтиженің шегі', 'Бұл бактерияларды табиғатқа шығару тәжірибесі емес.')
    ]
}
for name, steps in scenes.items():
    clips = []
    for i, (image, title, body) in enumerate(steps):
        ass = root / f'build/{name}-{i}.ass'
        ass.write_text(f'''[Script Info]
PlayResX: 1280
PlayResY: 720
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Noto Sans,39,&H00FFFFFF,&H00FFFFFF,&H00252F49,&H00252F49,-1,0,0,0,100,100,0,0,3,14,0,2,40,40,102,1
Style: Body,Noto Sans,26,&H00FFFFFF,&H00FFFFFF,&H00252F49,&H00252F49,0,0,0,0,100,100,0,0,3,10,0,2,40,40,45,1
Style: Note,Noto Sans,17,&H00252F49,&H00252F49,&H00FFFFFF,&H00FFFFFF,0,0,0,0,100,100,0,0,3,5,0,7,25,25,20,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:07.00,Title,,0,0,0,,{{\\fad(350,250)}}{title}
Dialogue: 0,0:00:00.00,0:00:07.00,Body,,0,0,0,,{{\\fad(600,250)}}{body}
Dialogue: 0,0:00:00.00,0:00:07.00,Note,,0,0,0,,Оқу моделі · дыбыссыз
''', encoding='utf-8')
        output = root / f'build/{name}-{i}.mp4'
        crop = 'crop=231:231:6:10,' if image == 'plasmid-afm.jpg' else ''
        vf = f"{crop}scale=1600:900:force_original_aspect_ratio=decrease,pad=1600:900:(ow-iw)/2:(oh-ih)/2:color=0xf4f6fa,zoompan=z='min(zoom+0.00035,1.065)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=175:s=1280x720:fps=25,subtitles={ass},fade=t=in:st=0:d=0.35,fade=t=out:st=6.7:d=0.3"
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(assets/image), '-vf', vf, '-frames:v', '175', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', str(output)], check=True)
        clips.append(output)
    listing = root / f'build/{name}.txt'
    listing.write_text(''.join(f"file '{p}'\n" for p in clips))
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(listing), '-c', 'copy', '-movflags', '+faststart', str(assets/f'{name}.mp4')], check=True)
    print(name, '28 seconds', flush=True)
