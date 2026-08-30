"""CSV adapter. API sources can convert their payloads to UpdateInput without changing engines."""
import pandas as pd
from app.schemas import UpdateInput
def read_csv(path: str) -> list[UpdateInput]:
    frame=pd.read_csv(path)
    records=frame.where(frame.notna(),None).to_dict(orient="records")
    return [UpdateInput(**record) for record in records]
