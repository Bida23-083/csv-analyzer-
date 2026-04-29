from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "running"}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()

    # Load file into pandas
    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    # Basic info
    rows, cols = df.shape
    columns = list(df.columns)
    dtypes = {col: str(df[col].dtype) for col in columns}

    # Missing values
    missing = {col: int(df[col].isnull().sum()) for col in columns}

    # Duplicates
    duplicates = int(df.duplicated().sum())

    # Numeric stats
    numeric_stats = {}
    for col in df.select_dtypes(include="number").columns:
        numeric_stats[col] = {
            "min": round(float(df[col].min()), 2),
            "max": round(float(df[col].max()), 2),
            "mean": round(float(df[col].mean()), 2),
            "median": round(float(df[col].median()), 2),
        }

    # Top values for text columns
    top_values = {}
    for col in df.select_dtypes(include="object").columns:
        top_values[col] = df[col].value_counts().head(5).to_dict()

    # Preview first 10 rows
    preview = df.head(10).fillna("").to_dict(orient="records")

    return {
        "rows": rows,
        "cols": cols,
        "columns": columns,
        "dtypes": dtypes,
        "missing": missing,
        "duplicates": duplicates,
        "numeric_stats": numeric_stats,
        "top_values": top_values,
        "preview": preview,
    }