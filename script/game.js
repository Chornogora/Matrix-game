const endOfGamePoints = 30;
const min = -10;
const max = 10;
const animationTurns = 4;
const pathLength = 260;
const verticalShift = 20;

const game = new Vue({
    el: "#game",
    data: {
        status: "start",
        playerPoints: 0,
        enemyPoints: 0,
        text: 'default'
    },
    methods: {
        start: () => {
            playSound("tick");
            document.getElementById("field").setAttribute("style", "display: block")
            game.status = "choosing";
            game.playerPoints = 0;
            game.enemyPoints = 0;
            battleground.reset();
            matrix.generate();
        },
        finishRound: () => {
            if (matrix.result > 0) {
                game.playerPoints += matrix.result;
            } else if (matrix.result < 0) {
                game.enemyPoints -= matrix.result;
            }

            if (game.playerPoints >= endOfGamePoints) {
                playSound("full-victory")
                game.status = "finished";
                game.text = 'Ви перемогли!';
                setTimeout(() => game.toStart(), 4000);
            } else if (game.enemyPoints >= endOfGamePoints) {
                playSound("full-defeat")
                game.status = "finished";
                game.text = 'Ви програли!';
                setTimeout(() => game.toStart(), 4000);
            } else {
                game.status = "choosing";
                battleground.reset();
                matrix.generate();
            }
        },
        toStart: () => {
            game.status = "start";
            document.getElementById("field").setAttribute("style", "display: none")
        }
    }
});

const controls = new Vue({
    el: "#controls",
    data: {
        enemyStyle: "random"
    },
    methods: {
        setEnemyStyle: (style) => {
            controls.enemyStyle = style
        },
        getStatus: () => {
            return game.status;
        }
    }
});

const matrix = new Vue({
    el: "#matrix",
    data: {
        types: [
            {name: "avia", image: "images/plane.png", trajectory: "zigzag", sound: "avia"},
            {name: "tank", image: "images/tank.png", trajectory: "line", sound: "tank"},
            {name: "infantry", image: "images/soldiers.png", trajectory: "line", sound: "infantry"},
            {name: "ship", image: "images/ship.png", trajectory: "zigzag", sound: "ship"}],
        playerStrategy: null,
        enemyStrategy: null,
        result: 0,
        rows: []
    },
    methods: {
        generate: () => {
            if (game.status === "choosing") {
                matrix.result = 0;
                matrix.playerStrategy = null;
                matrix.enemyStrategy = null;
                matrix.rows = [];
                matrix.types.forEach(type => {
                    const cells = [];
                    matrix.types.forEach(() => cells.push({points: random(min, max)}));
                    matrix.rows.push({
                        type: type,
                        cells: cells,
                        effective: false,
                        chosen: false
                    })
                });
                matrix.$forceUpdate();
            }
        },
        getCellStatus: (cell, row) => {
            if (row === matrix.playerStrategy && enemyStrategy !== null && row[matrix.enemyStrategy] === cell) {
                return "fight";
            } else if (cell.pingByEnemy) {
                return "pingByEnemy";
            } else if (row.chosen) {
                return "chosen";
            } else if (row.effective) {
                return "effective"
            } else {
                return "ineffective";
            }
        },
        showEffective: () => {
            if (game.status !== 'choosing') {
                return;
            }
            let min = matrix.rows[0];
            min.effective = true;
            let minValue = Math.min(...matrix.rows[0].cells.map(cell => cell.points));
            for (let i = 1; i < matrix.rows.length; ++i) {
                let minPerRow = Math.min(...matrix.rows[i].cells.map(cell => cell.points));
                if (minPerRow > minValue) {
                    matrix.rows.forEach(row => row.effective = false);
                    min = matrix.rows[i];
                    min.effective = true;
                    minValue = minPerRow;
                } else if (minPerRow === minValue) {
                    min = matrix.rows[i];
                    min.effective = true;
                }
            }

            setTimeout(() => {
                matrix.rows.forEach(row => row.effective = false)
            }, 400);
        },
        chooseStrategy: (row) => {
            if (game.status === "choosing") {
                row.chosen = true;
                matrix.playerStrategy = row;
                game.status = "enemy-choosing";

                setTimeout(() => {
                    matrix.enemyChoosing();
                }, 1000)
            }
        },
        enemyChoosing: () => {
            switch (controls.enemyStyle) {
                case 'random':
                    matrix.enemyStrategy = random(0, matrix.types.length - 1);
                    break;
                case 'effective':
                    matrix.enemyStrategy = matrix.getEnemyEffective();
                    break;
                case 'gambling':
                    matrix.enemyStrategy = matrix.getEnemyMax();
            }
            matrix.pingEnemyChoice(0);
        },
        getEnemyEffective: () => {
            let max = 0;
            let maxValue = Math.max(...matrix.rows.map(row => row.cells[0].points));
            for (let i = 1; i < matrix.rows.length; ++i) {
                let maxPerRow = Math.max(...matrix.rows.map(row => row.cells[i].points));
                if (maxPerRow < maxValue) {
                    maxValue = maxPerRow;
                    max = i;
                }
            }
            return max;
        },
        getEnemyMax: () => {
            let min = 0;
            let minValue = Math.min(...matrix.rows.map(row => row.cells[0].points));
            for (let i = 1; i < matrix.rows.length; ++i) {
                let maxPerRow = Math.min(...matrix.rows.map(row => row.cells[i].points));
                if (maxPerRow < minValue) {
                    minValue = maxPerRow;
                    min = i;
                }
            }
            return min;
        },
        pingEnemyChoice: (columnCount) => {
            if (columnCount === matrix.types.length) {
                matrix.rows.forEach(row => row.cells.forEach(cell => cell.pingByEnemy = false));
                matrix.rows.forEach(row => row.cells[matrix.enemyStrategy].chosenByEnemy = true);
                matrix.playerStrategy.cells[matrix.enemyStrategy].fight = true;
                matrix.result = matrix.playerStrategy.cells[matrix.enemyStrategy].points;
                battleground.coordinates.player.type = matrix.playerStrategy.type;
                battleground.coordinates.enemy.type = matrix.rows[matrix.enemyStrategy].type;
                game.status = "fighting";

                playSound("gong")
                matrix.$forceUpdate();
                setTimeout(() => {
                    playSound(matrix.playerStrategy.type.sound);
                    battleground.animate(0);
                }, 1300);
            } else {
                matrix.rows.forEach(row => row.cells.forEach(cell => cell.pingByEnemy = false));
                matrix.rows.forEach(row => row.cells[columnCount].pingByEnemy = true);
                playSound("tick");
                setTimeout(() => matrix.pingEnemyChoice(columnCount + 1), 500);
                matrix.$forceUpdate();
            }
        },
        getStatus: () => {
            return game.status;
        }
    }
});

const battleground = new Vue({
    el: "#battleground",
    data: {
        coordinates: {
            player: {
                type: {name: "undefined"},
                shiftX: 0,
                shiftY: 0
            },
            enemy: {
                type: {name: "undefined"},
                shiftX: 0,
                shiftY: 0
            }
        }
    },
    methods: {
        animate: (turn) => {
            if (turn < animationTurns) {
                battleground.coordinates.player.shiftX += pathLength / animationTurns;
                if (battleground.coordinates.player.type.trajectory === 'zigzag') {
                    battleground.coordinates.player.shiftY += (turn % 2 === 0) ? verticalShift : -verticalShift;
                }

                battleground.coordinates.enemy.shiftX += pathLength / animationTurns;
                if (battleground.coordinates.enemy.type.trajectory === 'zigzag') {
                    battleground.coordinates.enemy.shiftY += (turn % 2 === 0) ? verticalShift : -verticalShift;
                }

                setTimeout(() => battleground.animate(turn + 1), 500);
                battleground.$forceUpdate();
            } else {
                playRandomSound(["shooting-1", "shooting-2", "shooting-3"]);
                setTimeout(() => battleground.drawOrDefeat(), 1500);
            }
        },
        drawOrDefeat: () => {
            if (matrix.result > 0) {
                playSound("victory");
                battleground.coordinates.enemy = {
                    type: {name: "undefined"},
                    shiftX: 0,
                    shiftY: 0
                }
            } else if (matrix.result < 0) {
                playSound("defeat");
                battleground.coordinates.player = {
                    type: {name: "undefined"},
                    shiftX: 0,
                    shiftY: 0
                }
            }
            matrix.$forceUpdate();
            setTimeout(() => game.finishRound(), 1500);
        },
        reset: () => {
            battleground.coordinates.enemy = {
                type: {name: "undefined"},
                shiftX: 0,
                shiftY: 0
            };
            battleground.coordinates.player = {
                type: {name: "undefined"},
                shiftX: 0,
                shiftY: 0
            };
            matrix.$forceUpdate();
        },
        getStatus: () => {
            return game.status;
        }
    }
});

matrix.generate();