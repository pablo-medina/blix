import assert from 'node:assert/strict';
import {
    bounceBallFromPaddle,
    resolveCircleRectangleCollision,
    stabilizeBallTrajectory,
    steerEnemyAwayFromWalls
} from './physics';

const brick = { x: 100, y: 100, width: 64, height: 24 };

{
    const ball = { x: 132, y: 95, dx: 1, dy: 6, radius: 8, baseSpeed: Math.hypot(1, 6) };
    const normal = resolveCircleRectangleCollision(ball, brick);
    assert.deepEqual(normal, { x: 0, y: -1 });
    assert.ok(ball.dy < 0);
}

{
    const ball = { x: 96, y: 112, dx: 6, dy: 1, radius: 8, baseSpeed: Math.hypot(6, 1) };
    const normal = resolveCircleRectangleCollision(ball, brick);
    assert.deepEqual(normal, { x: -1, y: 0 });
    assert.ok(ball.dx < 0);
}

{
    const ball = { x: 96, y: 96, dx: 5, dy: 5, radius: 8, baseSpeed: 6 };
    const incomingSpeed = Math.hypot(ball.dx, ball.dy);
    const normal = resolveCircleRectangleCollision(ball, brick);
    assert.ok(normal && normal.x < 0 && normal.y < 0);
    assert.ok(ball.dx < 0 && ball.dy < 0);
    assert.ok(Math.abs(Math.hypot(ball.dx, ball.dy) - incomingSpeed) < 0.001);
}

{
    const ball = { x: 180, y: 200, dx: 0, dy: 8, radius: 8, baseSpeed: 8 };
    bounceBallFromPaddle(ball, { x: 100, y: 210, width: 160, height: 28 }, 0);
    assert.ok(ball.dy < 0);
    assert.ok(Math.abs(ball.dx) < 0.001);
}

{
    const ball = { x: 248, y: 200, dx: 0, dy: 10, radius: 8, baseSpeed: 8 };
    bounceBallFromPaddle(ball, { x: 100, y: 210, width: 160, height: 28 }, 0);
    assert.ok(ball.dx > 0);
    assert.ok(ball.dy < 0);
    assert.ok(Math.abs(Math.hypot(ball.dx, ball.dy) - 10) < 0.001);
}

{
    const steering = steerEnemyAwayFromWalls(
        1040,
        300,
        2,
        0,
        2,
        { x: 24, y: 24, width: 1032, height: 696 },
        80
    );
    assert.ok(steering.x < 0);
}

{
    const ball = { x: 900, y: 640, dx: 8, dy: 0.05, radius: 32, baseSpeed: 8 };
    const changed = stabilizeBallTrajectory(ball, -1);
    assert.equal(changed, true);
    assert.ok(ball.dy < -1.9);
    assert.ok(Math.abs(Math.hypot(ball.dx, ball.dy) - 8.0002) < 0.001);
}

console.log('Physics tests passed');
