"""Validated document model. Synthetic fixtures only."""
from datetime import date, timedelta
import re

def integer(value, low, high, label):
    if type(value) is not int or not low <= value <= high:
        raise ValueError(f"{label} must be an integer between {low} and {high}.")
    return value

def text(value, label, maximum=120):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ValueError(f"{label} must contain 1–{maximum} characters.")
    return value.strip()

def choice(value, allowed, label):
    if value not in allowed:
        raise ValueError(f"Invalid {label}.")
    return value

def items(raw, key):
    result=raw.get(key)
    if not isinstance(result,list) or len(result)>150:
        raise ValueError(f"{key} must be a list of at most 150 entries.")
    seen=set()
    for item in result:
        if not isinstance(item,dict): raise ValueError("Each entry must be an object.")
        key_id=item.get("id")
        if not isinstance(key_id,str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,60}",key_id) or key_id in seen:
            raise ValueError("Entry identifiers must be unique and valid.")
        seen.add(key_id)
    return result

def base(raw):
    if not isinstance(raw,dict) or type(raw.get("version")) is not int or raw["version"]!=1:
        raise ValueError("Expected a version 1 document.")
    return {"version":1,"title":text(raw.get("title"),"Title")}
def validate(raw):
    out=base(raw);out["events"]=[]
    for x in items(raw,"events"):
        try:
            start=date.fromisoformat(x.get("date", ""))
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}",x["date"]) or not 2000<=start.year<=2099:raise ValueError()
        except (ValueError,TypeError):raise ValueError("Date must be YYYY-MM-DD, between 2000 and 2099.")
        event={"id":x["id"],"title":text(x.get("title"),"Event title"),"resource":text(x.get("resource"),"Equipment",60),"date":start.isoformat(),"duration":integer(x.get("duration"),1,14,"Duration days"),"repeat":choice(x.get("repeat"),["once","weekly"],"recurrence"),"count":integer(x.get("count"),1,52,"Occurrences"),"note":text(x.get("note") or "—","Note",1000)}
        if event["repeat"]=="once":event["count"]=1
        out["events"].append(event)
    return out

def occurrences(doc):
    result=[]
    for e in doc["events"]:
        for n in range(e["count"]):
            start=date.fromisoformat(e["date"])+timedelta(days=n*7)
            result.append({**e,"occurrence":n,"start":start.isoformat(),"end":(start+timedelta(days=e["duration"])).isoformat()})
    return sorted(result,key=lambda x:(x["start"],x["id"],x["occurrence"]))

def analyze(doc):
    events=occurrences(doc);conflicts=[]
    for i,a in enumerate(events):
        for b in events[i+1:]:
            if b["start"]>=a["end"]:break
            if a["resource"].casefold()==b["resource"].casefold():conflicts.append([a["id"],a["occurrence"],b["id"],b["occurrence"]])
    return {"occurrences":events,"conflicts":conflicts,"metrics":{"Schedules":len(doc["events"]),"Occurrences":len(events),"Equipment":len(set(e["resource"].casefold() for e in events)),"Conflicts":len(conflicts)}}
