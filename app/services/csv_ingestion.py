"""CSV adapter. API sources can convert their payloads to UpdateInput without changing engines."""
import math
import pandas as pd
from app.schemas import UpdateInput
def _none_if_nan(v):
    """Convert float NaN (which pandas emits for missing numeric cells) to None."""
    if isinstance(v, float) and math.isnan(v):
        return None
    return v
def read_csv(path: str) -> list[UpdateInput]:
    frame=pd.read_csv(path)
    records=frame.where(frame.notna(),None).to_dict(orient="records")
    cleaned=[{k:_none_if_nan(v) for k,v in row.items()} for row in records]
    return [UpdateInput(**record) for record in cleaned]
