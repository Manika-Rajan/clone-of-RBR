from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # C:\Users\Administrator\Downloads\test2\clone-of-RBR\backend
PROJECT_ROOT = BASE_DIR.parent  # C:\Users\Administrator\Downloads\test2\clone-of-RBR
template_path = PROJECT_ROOT / 'frontend' / 'build' / 'index.html'
print(f"Template path: {template_path}")
print(f"Exists: {template_path.exists()}")