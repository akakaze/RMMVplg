(function() {
    Game_Player.prototype.getInputDirection = function() {
        return Input.dir8;
    };
    Game_Character.prototype.findDirectionTo = function(goalX, goalY) {
        var searchLimit = this.searchLimit();
        var mapWidth = $gameMap.width();
        var nodeList = [];
        var openList = [];
        var closedList = [];
        var start = {};
        var best = start;

        if (this.x === goalX && this.y === goalY) {
            return 0;
        }

        start.parent = null;
        start.x = this.x;
        start.y = this.y;
        start.g = 0;
        start.f = $gameMap.distance(start.x, start.y, goalX, goalY);
        nodeList.push(start);
        openList.push(start.y * mapWidth + start.x);

        while (nodeList.length > 0) {
            var bestIndex = 0;
            for (var i = 0; i < nodeList.length; i++) {
                if (nodeList[i].f < nodeList[bestIndex].f) {
                    bestIndex = i;
                }
            }

            var current = nodeList[bestIndex];
            var x1 = current.x;
            var y1 = current.y;
            var pos1 = y1 * mapWidth + x1;
            var g1 = current.g;

            nodeList.splice(bestIndex, 1);
            openList.splice(openList.indexOf(pos1), 1);
            closedList.push(pos1);

            if (current.x === goalX && current.y === goalY) {
                best = current;
                break;
            }

            if (g1 >= searchLimit) {
                continue;
            }

            for (var hor = 4; hor <= 6; hor++) {
                for (var ver = 2; ver <= 8; ver += 3) {
                    if (hor === ver) continue;
                    else {
                        var x2 = $gameMap.roundXWithDirection(x1, hor);
                        var y2 = $gameMap.roundYWithDirection(y1, ver);
                        var pos2 = y2 * mapWidth + x2;

                        if (closedList.contains(pos2)) {
                            continue;
                        }
                        if (!this.canPassDiagonally(x1, y1, hor, ver)) {
                            continue;
                        }

                        var g2 = g1 + 1;
                        var index2 = openList.indexOf(pos2);

                        if (index2 < 0 || g2 < nodeList[index2].g) {
                            var neighbor;
                            if (index2 >= 0) {
                                neighbor = nodeList[index2];
                            } else {
                                neighbor = {};
                                nodeList.push(neighbor);
                                openList.push(pos2);
                            }
                            neighbor.parent = current;
                            neighbor.x = x2;
                            neighbor.y = y2;
                            neighbor.g = g2;
                            neighbor.f = g2 + $gameMap.distance(x2, y2, goalX, goalY);
                            if (!best || neighbor.f - neighbor.g < best.f - best.g) {
                                best = neighbor;
                            }
                        }

                    }
                }
            }
        }

        var node = best;
        while (node.parent && node.parent !== start) {
            node = node.parent;
        }

        var deltaX1 = $gameMap.deltaX(node.x, start.x);
        var deltaY1 = $gameMap.deltaY(node.y, start.y);
        if (deltaX1 !== 0 || deltaY1 !== 0) {
            return 5 - deltaY1 * 3 + deltaX1;
        }

        var deltaX2 = this.deltaXFrom(goalX);
        var deltaY2 = this.deltaYFrom(goalY);
        if (Math.abs(deltaX2) > Math.abs(deltaY2)) {
            return deltaX2 > 0 ? 4 : 6;
        } else if (deltaY2 !== 0) {
            return deltaY2 > 0 ? 8 : 2;
        }

        return 0;
    };
    Game_Player.prototype.executeMove = function(d) {
        if ((d & 1) === 0) {
            this.moveStraight(d);
        } else {
            var h = d > 5 ? d - 3 : d + 3;
            var v = d + 5 - h;
            this.moveDiagonally(h, v);
        }
    };
})();