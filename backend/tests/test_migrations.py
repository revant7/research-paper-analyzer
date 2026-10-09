import pytest
import os
import subprocess
import sys


def test_alembic_migrations():
    """Verify that alembic migrations can upgrade to head and downgrade cleanly."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_db_path = os.path.join(backend_dir, "alembic_test.db")
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

    env = os.environ.copy()
    env["DATABASE_URL"] = f"sqlite+aiosqlite:///{test_db_path}"

    try:
        # 1. Upgrade to head
        res_up = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=backend_dir,
            env=env,
            capture_output=True,
            text=True
        )
        assert res_up.returncode == 0, f"Alembic upgrade failed: {res_up.stderr}"
        assert os.path.exists(test_db_path)

        # 2. Downgrade to base
        res_down = subprocess.run(
            [sys.executable, "-m", "alembic", "downgrade", "base"],
            cwd=backend_dir,
            env=env,
            capture_output=True,
            text=True
        )
        assert res_down.returncode == 0, f"Alembic downgrade failed: {res_down.stderr}"

        # 3. Upgrade back to head
        res_up2 = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            cwd=backend_dir,
            env=env,
            capture_output=True,
            text=True
        )
        assert res_up2.returncode == 0, f"Alembic re-upgrade failed: {res_up2.stderr}"

    finally:
        if os.path.exists(test_db_path):
            try:
                os.remove(test_db_path)
            except Exception:
                pass
