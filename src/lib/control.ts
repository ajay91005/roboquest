export function simulatePid(kp: number, ki: number, kd: number) {
  let speed = 0;
  let integral = 0;
  let previousSpeed = 0;
  const dt = 0.02;
  return Array.from({ length: 251 }, (_, index) => {
    if (index === 0) return { time: 0, speed: 0 };
    const error = 1 - speed;
    const derivative = -(speed - previousSpeed) / dt;
    const requested = kp * error + ki * integral + kd * derivative;
    const command = Math.max(-2, Math.min(2, requested));
    if (Math.abs(requested) < 2 || Math.sign(error) !== Math.sign(requested))
      integral += error * dt;
    previousSpeed = speed;
    speed += ((command - speed) / 0.4) * dt;
    return { time: index * dt, speed };
  });
}

export function evaluatePid(kp: number, ki: number, kd: number) {
  const response = simulatePid(kp, ki, kd);
  const finalError = Math.abs(1 - response.at(-1)!.speed);
  const overshoot = Math.max(0, ...response.map((point) => point.speed - 1));
  return {
    finalError,
    overshoot,
    passed: finalError < 0.05 && overshoot < 0.1,
  };
}
