class Game {
    constructor() {
        this.currentMode = 'mode1';
        this.cookingOrders = new Map(); // key: orderKey, value: {order, state, timer, timeLeft}
        this.penaltyAmount = 30;
        this.operationOrderIndex = 0; // 当前上菜索引
        this.operationOrdersList = [];
        this.orderKeySeed = 1; // 用于唯一标识每个上菜实例
        this.sharedOrderIndex = 0; // 当前已上菜的数量
        this.sharedOrders = []; // 共享订单池
        
        // Initialize UI elements
        this.initializeUI();
        this.initializeEventListeners();
        
        // Load initial data
        this.loadInitialData();
    }

    initializeUI() {
        // Mode selection
        this.mode1Btn = document.getElementById('mode1');
        this.mode2Btn = document.getElementById('mode2');
        this.mode1Content = document.getElementById('mode1-content');
        this.mode2Content = document.getElementById('mode2-content');

        // Operation area elements (Mode 1)
        this.operationOrders = document.getElementById('operation-orders');
        this.operationSuccess = document.getElementById('operation-success');
        this.operationFail = document.getElementById('operation-fail');
        this.operationProfit = document.getElementById('operation-profit');
        this.serveNextBtn = document.getElementById('serve-next-btn');

        // Team elements (Mode 2)
        this.sharedOrders = document.getElementById('shared-orders');
        this.mode2TeamAOrders = document.getElementById('mode2-team-a-orders');
        this.mode2TeamBOrders = document.getElementById('mode2-team-b-orders');
        this.mode2TeamASuccess = document.getElementById('mode2-team-a-success');
        this.mode2TeamBSuccess = document.getElementById('mode2-team-b-success');
        this.mode2TeamAFail = document.getElementById('mode2-team-a-fail');
        this.mode2TeamBFail = document.getElementById('mode2-team-b-fail');
        this.mode2TeamAProfit = document.getElementById('mode2-team-a-profit');
        this.mode2TeamBProfit = document.getElementById('mode2-team-b-profit');
        this.serveNextSharedBtn = document.getElementById('serve-next-shared-btn');
        this.sharedOrderContainer = document.getElementById('shared-order-container');
    }

    initializeEventListeners() {
        // Mode selection
        this.mode1Btn.addEventListener('click', () => this.switchMode('mode1'));
        this.mode2Btn.addEventListener('click', () => this.switchMode('mode2'));

        // Serve next order in operation mode
        this.serveNextBtn.addEventListener('click', () => this.serveNextOrder());

        // 动态事件委托：倒计时选择、成功/失败
        this.operationOrders.addEventListener('click', (e) => {
            const li = e.target.closest('li[data-order-key]');
            if (!li) return;
            const orderKey = li.getAttribute('data-order-key');
            const cookingObj = this.cookingOrders.get(orderKey);
            if (!cookingObj) return;
            if (e.target.classList.contains('timer-btn')) {
                const minutes = parseInt(e.target.dataset.minutes);
                this.startOrderTimer(orderKey, minutes);
            }
            if (e.target.classList.contains('success-btn')) {
                this.handleOrderResult(orderKey, true);
            }
            if (e.target.classList.contains('fail-btn')) {
                this.handleOrderResult(orderKey, false);
            }
        });

        if (this.serveNextSharedBtn) {
            this.serveNextSharedBtn.addEventListener('click', () => this.serveNextSharedOrder());
        }
    }

    switchMode(mode) {
        this.currentMode = mode;
        this.mode1Btn.classList.toggle('active', mode === 'mode1');
        this.mode2Btn.classList.toggle('active', mode === 'mode2');
        this.mode1Content.classList.toggle('hidden', mode !== 'mode1');
        this.mode2Content.classList.toggle('hidden', mode !== 'mode2');
        this.loadInitialData();
    }

    loadInitialData() {
        if (this.currentMode === 'mode1') {
            this.operationOrdersList = [...mockData.teamA, ...mockData.teamB].map(order => ({...order, _served: false}));
            this.operationOrderIndex = 0;
            this.cookingOrders.clear();
            this.renderOperationOrders();
            this.serveNextBtn.disabled = false;
        } else {
            this.sharedOrdersList = [...mockData.sharedOrders];
            this.sharedOrderIndex = 0;
            this.visibleSharedOrders = [];
            this.renderSharedOrdersMulti();
            this.mode2TeamAOrders.innerHTML = '';
            this.mode2TeamBOrders.innerHTML = '';
            if (this.serveNextSharedBtn) this.serveNextSharedBtn.disabled = false;
        }
        this.updateProfit();
    }

    renderOperationOrders() {
        this.operationOrders.innerHTML = '';
        let hasOrder = false;
        for (const [orderKey, obj] of this.cookingOrders.entries()) {
            const {order, state, timeLeft} = obj;
            const li = document.createElement('li');
            li.className = 'order-item';
            li.setAttribute('data-order-key', orderKey);
            li.innerHTML = `
                <div class="order-main-row">
                  <span class="order-no">#${order.orderNo}</span>
                  <span class="order-name">${order.name}</span>
                  <span>${order.price}元</span>
                  <span class="order-ingredients">${order.ingredients.join(' ')}</span>
                </div>
                <div class="order-action-area">
                    ${this.getOrderActionAreaHtml(orderKey, state, timeLeft)}
                </div>
            `;
            this.operationOrders.appendChild(li);
            hasOrder = true;
        }
        if (!hasOrder) {
            const tip = document.createElement('div');
            tip.className = 'order-empty-tip';
            tip.textContent = '暂无订单，请点击"上菜"';
            this.operationOrders.appendChild(tip);
        }
    }

    getOrderActionAreaHtml(orderKey, state, timeLeft) {
        if (state === 'select-timer') {
            return `
                <button class="timer-btn" data-minutes="3">3分钟</button>
                <button class="timer-btn" data-minutes="5">5分钟</button>
            `;
        } else if (state === 'cooking') {
            const min = Math.floor(timeLeft / 60);
            const sec = timeLeft % 60;
            return `
                <span class="timer">${min}:${sec.toString().padStart(2, '0')}</span>
                <button class="success-btn">成功</button>
                <button class="fail-btn">失败</button>
            `;
        } else if (state === 'timeout') {
            return `<span style="color:#e74c3c;font-weight:bold;">超时</span>`;
        }
        return '';
    }

    serveNextOrder() {
        let nextIdx = this.operationOrderIndex;
        while (nextIdx < this.operationOrdersList.length && this.operationOrdersList[nextIdx]._served) {
            nextIdx++;
        }
        if (nextIdx >= this.operationOrdersList.length) {
            alert('所有订单已上完！');
            return;
        }
        this.operationOrderIndex = nextIdx;
        const order = this.operationOrdersList[this.operationOrderIndex];
        order._served = true;
        const orderKey = 'order_' + (this.orderKeySeed++);
        this.cookingOrders.set(orderKey, {
            order,
            state: 'select-timer',
            timeLeft: 0,
            timer: null
        });
        this.operationOrderIndex++;
        this.renderOperationOrders();
    }

    startOrderTimer(orderKey, minutes) {
        const obj = this.cookingOrders.get(orderKey);
        if (!obj) return;
        obj.state = 'cooking';
        obj.timeLeft = minutes * 60;
        this.renderOperationOrders();
        obj.timer = setInterval(() => {
            obj.timeLeft--;
            if (obj.timeLeft <= 0) {
                clearInterval(obj.timer);
                obj.state = 'timeout';
                this.renderOperationOrders();
                setTimeout(() => {
                    this.handleOrderResult(orderKey, false, true);
                }, 2000);
            } else {
                this.renderOperationOrders();
            }
        }, 1000);
    }

    handleOrderResult(orderKey, isSuccess, isTimeout = false) {
        const obj = this.cookingOrders.get(orderKey);
        if (!obj) return;
        if (obj.timer) clearInterval(obj.timer);
        const {order} = obj;
        const li = document.createElement('li');
        li.className = 'order-item ' + (isSuccess ? 'success' : 'fail');
        let scoreText = '';
        if (isSuccess) {
            scoreText = ` <span class='order-score'>+${order.price}分</span>`;
        } else {
            scoreText = ` <span class='order-score'>-30分</span>`;
        }
        li.innerHTML = `
            <div class="order-main-row">
                <span class="order-no">#${order.orderNo}</span>
                <span class="order-name">${order.name}</span>
                <span>${order.price}元</span>
                <span class="order-ingredients">${order.ingredients.join(' ')}</span>
                ${isTimeout ? '<span class="order-timeout">（超时）</span>' : ''}
                ${scoreText}
            </div>
        `;
        if (isSuccess) {
            this.operationSuccess.appendChild(li);
        } else {
            this.operationFail.appendChild(li);
        }
        this.cookingOrders.delete(orderKey);
        this.renderOperationOrders();
        this.updateProfit();
    }

    renderSharedOrdersMulti() {
        this.sharedOrderContainer.innerHTML = '';
        if (this.visibleSharedOrders.length === 0) {
            const tip = document.createElement('div');
            tip.className = 'order-empty-tip';
            tip.textContent = '请点击"上菜"';
            this.sharedOrderContainer.appendChild(tip);
        } else {
            this.visibleSharedOrders.forEach((order, idx) => {
                const div = document.createElement('div');
                div.className = 'order-item';
                // 判断是否已选择倒计时
                if (!order._selectedTimer) {
                    div.innerHTML = `
                        <div class="order-main-row">
                            <div class="order-header">
                                <span class="order-no">#${order.orderNo}</span>
                                <span class="order-name">${order.name}</span>
                                <span class="order-price">${order.price}元</span>
                            </div>
                            <span class="order-ingredients">${order.ingredients.join(' ')}</span>
                        </div>
                        <div class="order-action-area">
                            <button class="timer-btn" data-minutes="3" data-idx="${idx}">3分钟</button>
                            <button class="timer-btn" data-minutes="5" data-idx="${idx}">5分钟</button>
                        </div>
                    `;
                    div.querySelectorAll('.timer-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const minutes = parseInt(e.target.dataset.minutes);
                            this.selectSharedOrderTimer(idx, minutes);
                        });
                    });
                } else {
                    // 已选倒计时，显示倒计时在上，分配按钮在下
                    div.innerHTML = `
                        <div class="order-main-row">
                            <div class="order-header">
                                <span class="order-no">#${order.orderNo}</span>
                                <span class="order-name">${order.name}</span>
                                <span class="order-price">${order.price}元</span>
                            </div>
                            <span class="order-ingredients">${order.ingredients.join(' ')}</span>
                        </div>
                        <div class="order-action-area vertical-action-area">
                            <div class="timer-row" style="text-align:center; margin-bottom:10px;">
                                <span class="timer">${Math.floor(order._timeLeft / 60)}:${(order._timeLeft % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <div class="assign-row" style="display:flex; justify-content:center; gap:12px;">
                                <button class="assign-btn" data-team="A" data-idx="${idx}">分配给A队</button>
                                <button class="assign-btn" data-team="B" data-idx="${idx}">分配给B队</button>
                            </div>
                        </div>
                    `;
                    // 倒计时递减
                    if (!order._timer) {
                        order._timer = setInterval(() => {
                            order._timeLeft--;
                            if (order._timeLeft <= 0) {
                                clearInterval(order._timer);
                                order._timer = null;
                                // 超时后自动移除
                                this.visibleSharedOrders.splice(idx, 1);
                                this.renderSharedOrdersMulti();
                            } else {
                                // 只刷新当前订单的倒计时
                                const timerSpan = div.querySelector('.timer');
                                if (timerSpan) timerSpan.textContent = `${Math.floor(order._timeLeft / 60)}:${(order._timeLeft % 60).toString().padStart(2, '0')}`;
                            }
                        }, 1000);
                    }
                    div.querySelectorAll('.assign-btn').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const team = e.target.dataset.team;
                            const orderIdx = parseInt(e.target.dataset.idx);
                            if (order._timer) clearInterval(order._timer);
                            this.assignOrderToTeamMulti(orderIdx, team);
                        });
                    });
                }
                this.sharedOrderContainer.appendChild(div);
            });
        }
        if (this.sharedOrderIndex >= this.sharedOrdersList.length && this.visibleSharedOrders.length === 0) {
            const tip = document.createElement('div');
            tip.className = 'order-empty-tip';
            tip.textContent = '所有订单已上完！';
            this.sharedOrderContainer.appendChild(tip);
            if (this.serveNextSharedBtn) this.serveNextSharedBtn.disabled = true;
        }
    }

    selectSharedOrderTimer(idx, minutes) {
        const order = this.visibleSharedOrders[idx];
        order._selectedTimer = true;
        order._timeLeft = minutes * 60;
        order._timer = null;
        this.renderSharedOrdersMulti();
    }

    serveNextSharedOrder() {
        if (this.sharedOrderIndex < this.sharedOrdersList.length) {
            this.visibleSharedOrders.push(this.sharedOrdersList[this.sharedOrderIndex]);
            this.sharedOrderIndex++;
            this.renderSharedOrdersMulti();
            if (this.sharedOrderIndex >= this.sharedOrdersList.length) {
                this.serveNextSharedBtn.disabled = true;
            }
        }
    }

    assignOrderToTeamMulti(orderIdx, team) {
        const order = this.visibleSharedOrders[orderIdx];
        // 添加到对应队伍订单区
        const container = team === 'A' ? this.mode2TeamAOrders : this.mode2TeamBOrders;
        const li = document.createElement('li');
        li.className = 'order-item';
        // 直接进入倒计时和成功/失败按钮
        let timeLeft = order._timeLeft;
        let finished = false;
        li.innerHTML = `
            <div class="order-main-row">
                <div class="order-header">
                    <span class="order-no">#${order.orderNo}</span>
                    <span class="order-name">${order.name}</span>
                    <span class="order-price">${order.price}元</span>
                </div>
                <span class="order-ingredients">${order.ingredients.join(' ')}</span>
            </div>
            <div class="order-action-area">
                <span class="timer">${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}</span>
                <button class="success-btn">成功</button>
                <button class="fail-btn">失败</button>
            </div>
        `;
        const timer = setInterval(() => {
            if (finished) return;
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(timer);
                finished = true;
                li.querySelector('.order-action-area').innerHTML = `<span class="order-status fail">超时</span>`;
                li.classList.add('timeout');
                setTimeout(() => {
                    this.moveToPenaltyPool(order, li, team, 'timeout');
                }, 2000);
            } else {
                li.querySelector('.timer').textContent = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`;
            }
        }, 1000);
        li.querySelector('.success-btn').addEventListener('click', () => {
            if (finished) return;
            clearInterval(timer);
            finished = true;
            li.querySelector('.order-action-area').innerHTML = `<span class="order-status success">已完成</span>`;
            li.classList.add('success');
            this.moveToSuccessPool(order, li, team, 'success');
        });
        li.querySelector('.fail-btn').addEventListener('click', () => {
            if (finished) return;
            clearInterval(timer);
            finished = true;
            li.querySelector('.order-action-area').innerHTML = `<span class="order-status fail">失败</span>`;
            li.classList.add('fail');
            this.moveToPenaltyPool(order, li, team, 'fail');
        });
        container.appendChild(li);
        // 从池中移除该订单
        this.visibleSharedOrders.splice(orderIdx, 1);
        this.renderSharedOrdersMulti();
    }

    moveToSuccessPool(order, li, team, status) {
        const pool = team === 'A' ? this.mode2TeamASuccess : this.mode2TeamBSuccess;
        li.remove();
        pool.appendChild(li);
        this.updateProfit();
    }
    moveToPenaltyPool(order, li, team, status) {
        const pool = team === 'A' ? this.mode2TeamAFail : this.mode2TeamBFail;
        li.remove();
        pool.appendChild(li);
        this.updateProfit();
    }

    updateProfit() {
        if (this.currentMode === 'mode1') {
            // Update operation profit
            const successLis = Array.from(this.operationSuccess.children);
            const failLis = Array.from(this.operationFail.children);
            let totalScore = 0;
            let profit = 0;
            successLis.forEach(li => {
                const match = li.textContent.match(/\+(\d+)分/);
                if (match) totalScore += parseInt(match[1]);
            });
            failLis.forEach(li => {
                const match = li.textContent.match(/-(\d+)分/);
                if (match) totalScore -= parseInt(match[1]);
            });
            profit = totalScore;
            this.operationProfit.textContent = `${profit}元`;
            const totalScoreElem = document.getElementById('operation-total-score');
            if (totalScoreElem) totalScoreElem.textContent = profit;
        } else {
            // Update team profits and scores
            const teamASuccessCount = document.getElementById('mode2-team-a-success').children.length;
            const teamAFailCount = document.getElementById('mode2-team-a-fail').children.length;
            let teamAScore = 0;
            let teamAProfit = 0;
            // 统计A队积分
            Array.from(document.getElementById('mode2-team-a-success').children).forEach(li => {
                const match = li.textContent.match(/(\d+)元/);
                if (match) teamAScore += parseInt(match[1]);
            });
            Array.from(document.getElementById('mode2-team-a-fail').children).forEach(li => {
                const match = li.textContent.match(/(\d+)元/);
                if (match) teamAScore -= 30;
            });
            teamAProfit = (teamASuccessCount * 40) - (teamAFailCount * this.penaltyAmount);
            document.getElementById('mode2-team-a-profit').textContent = `${teamAProfit}元`;
            const teamAScoreElem = document.getElementById('mode2-team-a-score');
            if (teamAScoreElem) teamAScoreElem.textContent = teamAScore;

            const teamBSuccessCount = document.getElementById('mode2-team-b-success').children.length;
            const teamBFailCount = document.getElementById('mode2-team-b-fail').children.length;
            let teamBScore = 0;
            let teamBProfit = 0;
            // 统计B队积分
            Array.from(document.getElementById('mode2-team-b-success').children).forEach(li => {
                const match = li.textContent.match(/(\d+)元/);
                if (match) teamBScore += parseInt(match[1]);
            });
            Array.from(document.getElementById('mode2-team-b-fail').children).forEach(li => {
                const match = li.textContent.match(/(\d+)元/);
                if (match) teamBScore -= 30;
            });
            teamBProfit = (teamBSuccessCount * 40) - (teamBFailCount * this.penaltyAmount);
            document.getElementById('mode2-team-b-profit').textContent = `${teamBProfit}元`;
            const teamBScoreElem = document.getElementById('mode2-team-b-score');
            if (teamBScoreElem) teamBScoreElem.textContent = teamBScore;
        }
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 