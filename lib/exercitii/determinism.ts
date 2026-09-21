/**
 * Determinismul cerut de `PLAN.md` §7: un exercițiu trebuie să dea același
 * rezultat de fiecare dată, altfel verificarea n-are sens.
 *
 * `input()` e interzis, `random` pornește de la o sămânță fixă, iar data și ora
 * sunt înghețate. Rețea și fișiere nu există oricum în Pyodide.
 */

/** Sămânța cu care se pornește `random` înaintea fiecărui caz de test. */
export const SAMANTA = 0;

/** Ce întoarce `datetime.now()` și `time.time()` în timpul unui exercițiu. */
export const ACUM_FIXAT = "2024-01-01 12:00:00";

export const PRELUDIU = `
import builtins as _tut_builtins
import datetime as _tut_datetime
import random as _tut_random
import time as _tut_time

_tut_random.seed(${SAMANTA})

_TUT_ACUM = _tut_datetime.datetime(2024, 1, 1, 12, 0, 0)


class _TutData(_tut_datetime.datetime):
    @classmethod
    def now(cls, tz=None):
        return _TUT_ACUM if tz is None else _TUT_ACUM.replace(tzinfo=tz)

    @classmethod
    def utcnow(cls):
        return _TUT_ACUM

    @classmethod
    def today(cls):
        return _TUT_ACUM


_tut_datetime.datetime = _TutData
_tut_time.time = lambda: _TUT_ACUM.timestamp()


def _tut_input(*args, **kwargs):
    raise RuntimeError(
        "input() nu se poate folosi aici: exercițiul trebuie să dea "
        "același rezultat de fiecare dată."
    )


_tut_builtins.input = _tut_input
`;
