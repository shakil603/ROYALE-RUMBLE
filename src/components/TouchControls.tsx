import { useEffect, useRef } from "react";

interface Props {
  onMove: (x: number, y: number) => void;
  onMoveEnd: () => void;
  onFire: (active: boolean) => void;
  onDash: () => void;
}

export default function TouchControls({ onMove, onMoveEnd, onFire, onDash }: Props) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = joystickRef.current;
    if (!el) return;

    const getPos = (e: TouchEvent) => {
      const touch = Array.from(e.changedTouches).find((t) => t.identifier === activeId.current);
      return touch || null;
    };

    const handleStart = (e: TouchEvent) => {
      if (activeId.current !== null) return;
      const t = e.changedTouches[0];
      activeId.current = t.identifier;
      origin.current = { x: t.clientX, y: t.clientY };
      el.classList.add("active");
    };

    const handleMove = (e: TouchEvent) => {
      const t = getPos(e);
      if (!t) return;
      e.preventDefault();
      const dx = t.clientX - origin.current.x;
      const dy = t.clientY - origin.current.y;
      const max = 50;
      let nx = dx;
      let ny = dy;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        nx = (dx / len) * max;
        ny = (dy / len) * max;
      }
      el.style.transform = `translate(${nx}px, ${ny}px)`;
      onMove(nx / max, ny / max);
    };

    const handleEnd = (e: TouchEvent) => {
      const t = getPos(e);
      if (!t) return;
      activeId.current = null;
      el.style.transform = "translate(0,0)";
      el.classList.remove("active");
      onMoveEnd();
    };

    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: false });
    el.addEventListener("touchend", handleEnd);
    el.addEventListener("touchcancel", handleEnd);

    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("touchend", handleEnd);
      el.removeEventListener("touchcancel", handleEnd);
    };
  }, [onMove, onMoveEnd]);

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Movement joystick (bottom left) */}
      <div className="pointer-events-auto absolute left-5 bottom-24">
        <div className="relative h-32 w-32 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-sm">
          <div ref={joystickRef} className="absolute top-1/2 left-1/2 -ml-11 -mt-11 flex h-22 w-22 items-center justify-center rounded-full bg-white/20" style={{ width: 88, height: 88, marginLeft: -44, marginTop: -44 }}>
            <div className="h-10 w-10 rounded-full bg-cyan-400/60" />
          </div>
        </div>
      </div>

      {/* Fire button (bottom right) */}
      <button
        className="pointer-events-auto absolute right-7 bottom-24 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/60 border-2 border-red-300/40 text-white text-sm font-bold uppercase tracking-wider active:scale-90 transition-transform"
        onTouchStart={(e) => { e.preventDefault(); onFire(true); }}
        onTouchEnd={() => onFire(false)}
        onTouchCancel={() => onFire(false)}
      >
        FIRE
      </button>

      {/* Dash button */}
      <button
        className="pointer-events-auto absolute right-7 bottom-44 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/50 border-2 border-cyan-200/40 text-white text-xs font-bold uppercase active:scale-90 transition-transform"
        onTouchStart={(e) => { e.preventDefault(); onDash(); }}
      >
        DASH
      </button>
    </div>
  );
}
