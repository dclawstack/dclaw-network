import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.alert import Alert, AlertStatus, AlertSeverity
from app.repositories.alert_repo import AlertRepository
from app.schemas.alert import AlertCreate, AlertUpdate, AlertRead
from app.core.utils import utc_now

router = APIRouter()


@router.get("", response_model=list[AlertRead])
async def list_alerts(
    status: AlertStatus | None = Query(None),
    severity: AlertSeverity | None = Query(None),
    device_id: uuid.UUID | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    repo = AlertRepository(db)
    return await repo.list_filtered(
        status=status,
        severity=severity,
        device_id=device_id,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=AlertRead, status_code=201)
async def create_alert(payload: AlertCreate, db: AsyncSession = Depends(get_db)):
    repo = AlertRepository(db)
    alert = Alert(**payload.model_dump())
    return await repo.create(alert)


@router.get("/{alert_id}", response_model=AlertRead)
async def get_alert(alert_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = AlertRepository(db)
    alert = await repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}", response_model=AlertRead)
async def update_alert(
    alert_id: uuid.UUID, payload: AlertUpdate, db: AsyncSession = Depends(get_db)
):
    repo = AlertRepository(db)
    alert = await repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    updates = payload.model_dump(exclude_unset=True)
    new_status = updates.get("status")

    if new_status == AlertStatus.acknowledged and alert.status == AlertStatus.open:
        alert.acknowledged_at = utc_now()
    elif new_status == AlertStatus.resolved:
        alert.resolved_at = utc_now()

    for field, value in updates.items():
        setattr(alert, field, value)
    alert.updated_at = utc_now()
    await db.commit()
    await db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=204)
async def delete_alert(alert_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    repo = AlertRepository(db)
    alert = await repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await repo.delete(alert)
