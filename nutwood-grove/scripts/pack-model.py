from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
model = root / 'squirrel.glb'
if not model.exists():
    raise SystemExit('Run npm test to regenerate squirrel.glb first.')
with zipfile.ZipFile(root / 'squirrel-model.zip', 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name, data in [
        ('fluffy-squirrel.glb', model.read_bytes()),
        ('README.txt', b'Nutwood Grove: procedural fluffy squirrel. Open fluffy-squirrel.glb in a glTF 2.0 viewer. This download is the posed mesh; the live game animates its limbs and tail in JavaScript.\n'),
    ]:
        info = zipfile.ZipInfo(name, date_time=(2026, 10, 22, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
with zipfile.ZipFile(root / 'squirrel-model.zip') as archive:
    assert archive.testzip() is None
    assert archive.read('fluffy-squirrel.glb') == model.read_bytes()
print(f'Model ZIP verified: {(root / "squirrel-model.zip").stat().st_size:,} bytes')
