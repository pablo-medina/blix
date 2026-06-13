export interface CircleBody {
    x: number;
    y: number;
    dx: number;
    dy: number;
    radius: number;
    baseSpeed: number;
}

export interface RectangleBody {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CollisionNormal {
    x: number;
    y: number;
}

export function circleIntersectsRectangle(circle: Pick<CircleBody, 'x' | 'y' | 'radius'>, rectangle: RectangleBody): boolean {
    const closestX = Math.max(rectangle.x, Math.min(circle.x, rectangle.x + rectangle.width));
    const closestY = Math.max(rectangle.y, Math.min(circle.y, rectangle.y + rectangle.height));
    const offsetX = circle.x - closestX;
    const offsetY = circle.y - closestY;
    return offsetX * offsetX + offsetY * offsetY <= circle.radius * circle.radius;
}

export function resolveCircleRectangleCollision(
    circle: CircleBody,
    rectangle: RectangleBody
): CollisionNormal | null {
    const incomingSpeed = Math.hypot(circle.dx, circle.dy) || circle.baseSpeed;
    const closestX = Math.max(rectangle.x, Math.min(circle.x, rectangle.x + rectangle.width));
    const closestY = Math.max(rectangle.y, Math.min(circle.y, rectangle.y + rectangle.height));
    let offsetX = circle.x - closestX;
    let offsetY = circle.y - closestY;
    const distanceSquared = offsetX * offsetX + offsetY * offsetY;

    if (distanceSquared > circle.radius * circle.radius) return null;

    let normalX = 0;
    let normalY = 0;
    let penetration = circle.radius;

    if (distanceSquared > 0.0001) {
        const distance = Math.sqrt(distanceSquared);
        normalX = offsetX / distance;
        normalY = offsetY / distance;
        penetration = circle.radius - distance;
    } else {
        const left = Math.abs(circle.x - rectangle.x);
        const right = Math.abs(rectangle.x + rectangle.width - circle.x);
        const top = Math.abs(circle.y - rectangle.y);
        const bottom = Math.abs(rectangle.y + rectangle.height - circle.y);
        const nearest = Math.min(left, right, top, bottom);

        if (nearest === left) normalX = -1;
        else if (nearest === right) normalX = 1;
        else if (nearest === top) normalY = -1;
        else normalY = 1;
        penetration = circle.radius + nearest;
    }

    const velocityAlongNormal = circle.dx * normalX + circle.dy * normalY;
    if (velocityAlongNormal >= 0) return null;

    circle.x += normalX * (penetration + 0.05);
    circle.y += normalY * (penetration + 0.05);
    circle.dx -= 2 * velocityAlongNormal * normalX;
    circle.dy -= 2 * velocityAlongNormal * normalY;
    normalizeBallSpeed(circle, incomingSpeed);

    return { x: normalX, y: normalY };
}

export function bounceBallFromPaddle(
    ball: CircleBody,
    paddle: RectangleBody,
    paddleVelocity: number
): void {
    const targetSpeed = Math.hypot(ball.dx, ball.dy) || ball.baseSpeed;
    const hitPosition = Math.max(
        -1,
        Math.min(1, (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2))
    );
    const maxAngle = Math.PI * 0.39;
    const angle = hitPosition * maxAngle;
    const movementInfluence = Math.max(-targetSpeed * 0.28, Math.min(targetSpeed * 0.28, paddleVelocity * 0.12));

    ball.dx = Math.sin(angle) * targetSpeed + movementInfluence;
    ball.dy = -Math.abs(Math.cos(angle) * targetSpeed);

    const minimumVerticalSpeed = targetSpeed * 0.42;
    if (Math.abs(ball.dy) < minimumVerticalSpeed) {
        ball.dy = -minimumVerticalSpeed;
    }
    normalizeBallSpeed(ball, targetSpeed);
}

export function normalizeBallSpeed(ball: CircleBody, targetSpeed = ball.baseSpeed): void {
    const speed = Math.hypot(ball.dx, ball.dy);
    if (speed < 0.0001) {
        ball.dx = 0;
        ball.dy = -targetSpeed;
        return;
    }
    const scale = targetSpeed / speed;
    ball.dx *= scale;
    ball.dy *= scale;
}

export function stabilizeBallTrajectory(
    ball: CircleBody,
    fallbackVerticalDirection: -1 | 1 = -1,
    minimumVerticalRatio = 0.24
): boolean {
    const speed = Math.hypot(ball.dx, ball.dy);
    if (speed < 0.0001) return false;

    const minimumVerticalSpeed = speed * minimumVerticalRatio;
    if (Math.abs(ball.dy) >= minimumVerticalSpeed) return false;

    const horizontalDirection = Math.abs(ball.dx) > 0.0001
        ? Math.sign(ball.dx)
        : 1;

    ball.dy = fallbackVerticalDirection * minimumVerticalSpeed;
    ball.dx = horizontalDirection * Math.sqrt(Math.max(0, speed * speed - ball.dy * ball.dy));
    return true;
}

export function steerEnemyAwayFromWalls(
    x: number,
    y: number,
    desiredX: number,
    desiredY: number,
    speed: number,
    bounds: RectangleBody,
    margin: number
): { x: number; y: number } {
    let steeringX = desiredX;
    let steeringY = desiredY;
    const strength = speed * 1.8;

    if (x < bounds.x + margin) steeringX += strength * (1 - (x - bounds.x) / margin);
    if (x > bounds.x + bounds.width - margin) steeringX -= strength * (1 - (bounds.x + bounds.width - x) / margin);
    if (y < bounds.y + margin) steeringY += strength * (1 - (y - bounds.y) / margin);
    if (y > bounds.y + bounds.height - margin) steeringY -= strength * (1 - (bounds.y + bounds.height - y) / margin);

    const magnitude = Math.hypot(steeringX, steeringY);
    const maximum = speed * 1.35;
    if (magnitude > maximum) {
        steeringX = steeringX / magnitude * maximum;
        steeringY = steeringY / magnitude * maximum;
    }
    return { x: steeringX, y: steeringY };
}
