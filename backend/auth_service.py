import json
import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from backend.db import get_conn

SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production-please")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pw, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    pw = plain.encode("utf-8")[:72]
    return bcrypt.checkpw(pw, hashed.encode("utf-8"))


def create_token(user_id: int, username: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def register_user(username: str, password: str) -> dict:
    hashed = hash_password(password)
    try:
        with get_conn() as conn:
            cursor = conn.execute(
                "INSERT INTO users (username, hashed_password) VALUES (?, ?)",
                (username, hashed),
            )
            conn.commit()
            return {"id": cursor.lastrowid, "username": username}
    except Exception:
        raise ValueError("Username already taken")


# DO NOT LOG — handles PII (password)
def login_user(username: str, password: str) -> dict:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, username, hashed_password FROM users WHERE username = ?",
            (username,),
        ).fetchone()
    if not row or not verify_password(password, row["hashed_password"]):
        raise ValueError("Invalid username or password")
    return {"id": row["id"], "username": row["username"]}


def save_case(user_id: int, data: dict) -> None:
    with get_conn() as conn:
        conn.execute(
            """INSERT INTO cases
               (user_id, transcript, facts, violations, demand_letter, dol_prefill)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                user_id,
                data.get("transcript"),
                json.dumps(data.get("facts")),
                json.dumps(data.get("violations")),
                data.get("demand_letter"),
                json.dumps(data.get("dol_prefill")),
            ),
        )
        conn.commit()


def delete_case(user_id: int, case_id: int) -> bool:
    with get_conn() as conn:
        result = conn.execute(
            "DELETE FROM cases WHERE id = ? AND user_id = ?",
            (case_id, user_id),
        )
        conn.commit()
        return result.rowcount > 0


def get_cases(user_id: int) -> list:
    with get_conn() as conn:
        rows = conn.execute(
            """SELECT id, transcript, facts, violations, demand_letter, dol_prefill, created_at
               FROM cases WHERE user_id = ?
               ORDER BY created_at DESC LIMIT 10""",
            (user_id,),
        ).fetchall()
    return [
        {
            "id": row["id"],
            "transcript": row["transcript"],
            "facts": json.loads(row["facts"]) if row["facts"] else None,
            "violations": json.loads(row["violations"]) if row["violations"] else None,
            "demand_letter": row["demand_letter"],
            "dol_prefill": json.loads(row["dol_prefill"]) if row["dol_prefill"] else None,
            "created_at": row["created_at"],
        }
        for row in rows
    ]
