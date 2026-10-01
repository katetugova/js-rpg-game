const player = {
    name: '',
    level: 1,
    maxHP: 100,
    currentHP: 100,
    strength: 10,
    defense: 5,
    inventory: ['healing-potion'],
    experience: 0,
    experienceToNextLevel: 50,
    tempBuffs: {}
};

const monstersByLocation = {
    forest: [
        {
            name: 'Волк',
            maxHP: 30,
            currentHP: 30,
            strength: 8,
            defense: 3,
            image: './images/enemies/wolf.png',
            experienceReward: 20,
            drops: ['healing-potion'],
        },
        {
            name: 'Гоблин',
            maxHP: 25,
            currentHP: 25,
            strength: 7,
            defense: 2,
            image: './images/enemies/goblin.png',
            experienceReward: 15,
            drops: ['hunter-knife']
        }
    ],
    ruins: [
        {
            name: 'Скелет',
            maxHP: 40,
            currentHP: 40,
            strength: 9,
            defense: 4,
            image: './images/enemies/skeleton.png',
            experienceReward: 30,
            drops: ['small-shield']
        },
        {
            name: 'Рыцарь-нежить',
            maxHP: 50,
            currentHP: 50,
            strength: 12,
            defense: 6,
            image: './images/enemies/cursed_knight.png',
            experienceReward: 40,
            drops: ['small-shield']
        }
    ],
    dungeon: [
        {
            name: 'Гигантская крыса',
            maxHP: 35,
            currentHP: 35,
            strength: 6,
            defense: 3,
            image: './images/enemies/rat.png',
            experienceReward: 25,
            drops: ['healing-potion']
        },
        {
            name: 'Монстр',
            maxHP: 80,
            currentHP: 80,
            strength: 15,
            defense: 8,
            image: './images/enemies/monster.png',
            experienceReward: 60,
            drops: ['teleport-scroll']
        }
    ]
};

const items = {
    'healing-potion': {
        name: 'Лечебное зелье',
        icon: './images/items/healing_potion.png',
        description: 'Восстанавливает 30 HP.',
        effect: () => {
            player.currentHP = Math.min(player.maxHP, player.currentHP + 30);
            logEvent('Вы использовали Лечебное зелье и восстановили 30 HP.');
            updatePlayerUI();
        }
    },
    'hunter-knife': {
        name: 'Охотничий нож',
        icon: './images/items/hunter_knife.png',
        description: 'Увеличивает силу на 2 до конца боя.',
        effect: () => {
            player.tempBuffs.strength = (player.tempBuffs.strength || 0) + 2;
            logEvent('Вы использовали Охотничий нож. Сила увеличена на 2 до конца боя.');
        }
    },
    'small-shield': {
        name: 'Малый щит',
        icon: './images/items/small_shield.png',
        description: 'Увеличивает защиту на 2 до конца боя.',
        effect: () => {
            player.tempBuffs.defense = (player.tempBuffs.defense || 0) + 2;
            logEvent('Вы использовали Малый щит. Защита увеличена на 2 до конца боя.');
        }
    },
    'teleport-scroll': {
        name: 'Свиток телепортации',
        icon: './images/items/teleport_scroll.png',
        description: 'Перемещает в деревню из любой локации.',
        effect: () => {
            logEvent('Вы использовали Свиток телепортации и вернулись в деревню.');
            changeState('village');
        }
    },
};

// Путь к фону для сцен
const sceneBackgrounds = {
    village: './images/locations/village.png',
    forest: './images/locations/forest.png',
    ruins: './images/locations/ruins.png',
    dungeon: './images/locations/dungeon.png'
};

const treasureItems = Object.keys(items);

// Элементы приветственного экрана
const startForm = document.getElementById('start-form');
const playerNameInput = document.getElementById('player-name');
const welcomeScreen = document.querySelector('.welcome');

// Элементы игрового экрана
const gameScreen = document.querySelector('.game');
const playerNameDisplay = document.querySelector('.character-panel__name');
const eventLogList = document.querySelector('.event-log__list');
const eventLogContainer = document.querySelector('.event-log');

// Элементы панели управления игроком
const resetButton = document.querySelector('.character-panel__button.button--danger');
const inventoryButton = document.querySelector('.character-panel__button.button--neutral');

// Элементы сцены
const locationHeader = document.querySelector('.game-scene__header');
const peaceActions = document.querySelector('.actions--peace');
const exploreActions = document.querySelector('.actions--explore');
const battleActions = document.querySelector('.actions--battle');
const gameSceneVisual = document.querySelector('.game-scene__visual');
const sceneBackground = document.querySelector('.game-scene__background');

// Элементы боя
const attackButton = document.querySelector('[data-action="attack"]');
const defendButton = document.querySelector('[data-action="defend"]');
const restButton = document.querySelector('[data-action="rest"]');
const runButton = document.querySelector('[data-action="run"]');
const useItemButton = document.querySelector('[data-action="use-item"]');

// Элементы инвентаря
const inventoryModal = document.getElementById('inventory-modal');
const inventoryList = inventoryModal.querySelector('.inventory-modal__list');
const closeInventoryButton = inventoryModal.querySelector('.inventory-modal__close-button');

// Элементы переходов между локациями
const forestButton = document.querySelector('[data-action="go-forest"]');
const ruinsButton = document.querySelector('[data-action="go-ruins"]');
const dungeonButton = document.querySelector('[data-action="go-dungeon"]');
const exploreButton = document.querySelector('[data-action="explore"]');
const returnButton = document.querySelector('[data-action="return"]');

// Элементы врага
const enemyBlock = document.querySelector('.game-scene__enemy');
const enemyImage = enemyBlock.querySelector('.game-scene__enemy-image');
const enemyName = enemyBlock.querySelector('.game-scene__enemy-name');
const enemyHP = enemyBlock.querySelector('.game-scene__enemy-hp');

// Элементы экрана окончания игры
const restartButton = document.getElementById('restart-button');

// Игровые переменные
let currentState = 'village';
let previousLocation = null;
let currentEnemy = null;
let playerIsDefending = false;

// Функция для запуска игры
function startGame(event) {
    event.preventDefault(); // Отменяем стандартную отправку формы

    const enteredName = playerNameInput.value.trim();

    // Проверяем, что имя не пустое
    if (enteredName.length === 0) {
        alert('Пожалуйста, введите имя персонажа.');
        return;
    }

    // Сохраняем имя игрока в объекте
    player.name = enteredName;

    // Обновляем интерфейс панели персонажа
    playerNameDisplay.textContent = `Имя: ${player.name}`;

    // Скрываем экран приветствия, показываем основной экран
    welcomeScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    // Пишем первое событие в журнал событий
    logEvent(`Герой по имени ${player.name} отправляется в своё первое великое приключение!`);
}

// Функция смены состояния игры
function changeState(newState) {
    currentState = newState;

    // Скрываем все группы действий
    peaceActions.classList.add('hidden');
    exploreActions.classList.add('hidden');
    battleActions.classList.add('hidden');

    // Обновляем фон
    updateSceneBackground(newState);

    if (newState !== 'battle') clearEnemy();

    // Обновляем сцену в зависимости от нового состояния
    switch (newState) {
        case 'village':
            locationHeader.textContent = 'Локация: Деревня';
            peaceActions.classList.remove('hidden');
            gameSceneVisual.classList.remove('battle'); // Убираем затемнение сцены
            break;

        case 'forest':
            locationHeader.textContent = 'Локация: Лес';
            exploreActions.classList.remove('hidden');
            break;

        case 'ruins':
            locationHeader.textContent = 'Локация: Руины';
            exploreActions.classList.remove('hidden');
            break;

        case 'dungeon':
            locationHeader.textContent = 'Локация: Подземелье';
            exploreActions.classList.remove('hidden');
            break;

        case 'battle':
            locationHeader.textContent = 'Бой!';
            battleActions.classList.remove('hidden');
            gameSceneVisual.classList.add('battle'); // Затемняем фон во время боя
            break;

        default:
            console.warn('Неизвестное состояние игры:', newState);
    }
}

function updateSceneBackground(state) {
    if (state === 'battle') return;

    const backgroundUrl = sceneBackgrounds[state] || sceneBackgrounds.village;
    sceneBackground.style.backgroundImage = `url("${backgroundUrl}")`;
}

function resetGame() {
    const confirmReset = confirm('Вы уверены, что хотите начать заново? Весь прогресс будет потерян.');

    if (confirmReset) {
        location.reload();
    }
}

// Функция для записи событий в журнал
function logEvent(message) {
    const newEvent = document.createElement('li');
    newEvent.classList.add('event-log__item');
    newEvent.textContent = message;

    eventLogList.appendChild(newEvent);

    eventLogContainer.scrollTop = eventLogContainer.scrollHeight;
}

// Вспомогательная функция для очистки врага со сцены
function clearEnemy() {
    enemyBlock.classList.add('hidden');
}

function findTreasure() {
    if (player.inventory.length >= 10) {
        logEvent('Ваш инвентарь переполнен. Вы не можете взять сокровище.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * treasureItems.length);
    const foundItem = treasureItems[randomIndex];

    player.inventory.push(foundItem);
    logEvent(`Вы нашли сокровище: ${items[foundItem]?.name || foundItem}!`);
}

// Старт битвы
function startBattle() {
    // Выбираем врагов в зависимости от текущей локации
    let availableMonsters = monstersByLocation[currentState];

    if (!availableMonsters || availableMonsters.length === 0) {
        console.error('Нет монстров для этой локации:', currentState);
        return;
    }

    // Выбираем случайного монстра
    const randomIndex = Math.floor(Math.random() * availableMonsters.length);
    const selectedMonster = availableMonsters[randomIndex];

    // Копируем данные монстра в currentEnemy
    currentEnemy = { ...selectedMonster };

    // Отобразить врага на экране
    showEnemy(currentEnemy);

    // Переключаем сцену в режим боя
    previousLocation = currentState;
    changeState('battle');

    // Логируем событие
    logEvent(`Вы столкнулись с врагом: ${selectedMonster.name}!`);
}

// Функция отображения врага
function showEnemy(enemy) {
    enemyImage.src = enemy.image;
    enemyImage.alt = enemy.name;
    enemyName.textContent = enemy.name;
    enemyHP.textContent = `HP: ${enemy.currentHP}/${enemy.maxHP}`;

    enemyBlock.classList.remove('hidden');
}

function playerAttack() {
    if (!currentEnemy) {
        console.warn('Нет врага для атаки.');
        return;
    }

    // Вычисляем урон игрока
    const totalStrength = player.strength + (player.tempBuffs.strength || 0);
    const playerDamage = Math.max(0, totalStrength - currentEnemy.defense);
    currentEnemy.currentHP -= playerDamage;

    logEvent(`Вы нанесли ${playerDamage} урона врагу: ${currentEnemy.name}.`);

    updateEnemyUI();

    // Проверяем смерть врага
    if (currentEnemy.currentHP <= 0) {
        logEvent(`Вы победили врага: ${currentEnemy.name}!`);
        gainExperience(currentEnemy.experienceReward);
        updatePlayerUI();
        tryDropLoot(currentEnemy);
        clearEnemy();
        player.tempBuffs = {};
        gameSceneVisual.classList.remove('battle');
        changeState(previousLocation || 'village');
        return;
    }

    // Враг отвечает
    enemyAttack();
}

function enemyAttack() {
    let effectiveDefense = player.defense + (player.tempBuffs.defense || 0);

    if (playerIsDefending) {
        effectiveDefense *= 2; // В два раза эффективнее защита
    }

    const enemyDamage = Math.max(0, currentEnemy.strength - effectiveDefense);
    player.currentHP -= enemyDamage;

    logEvent(`${currentEnemy.name} атаковал вас и нанёс ${enemyDamage} урона.`);

    updatePlayerUI();

    // Проверяем смерть игрока
    if (player.currentHP <= 0) {
        logEvent('Вы погибли в бою...');
        setTimeout(() => {
            gameOver();
            player.tempBuffs = {};
        }, 500);
    }
}

function gameOver() {
    document.getElementById('game-over').classList.remove('hidden');
    gameScreen.classList.add('hidden');
}

function playerDefend() {
    if (!currentEnemy) return;

    playerIsDefending = true;

    logEvent('Вы заняли оборонительную стойку.');

    // Враг атакует (но урон будет меньше)
    enemyAttack();

    // Сброс флага защиты на следующий ход
    playerIsDefending = false;
}

function attemptToRun() {
    if (!currentEnemy) return;

    const runChance = 0.2; // 20% шанс сбежать

    if (Math.random() < runChance) {
        logEvent('Вы успешно сбежали от врага!');
        clearEnemy();
        player.tempBuffs = {};
        changeState('village');
    } else {
        logEvent('Не удалось сбежать! Враг атакует.');
        enemyAttack();
    }
}

function openInventory(mode = 'peace') {
    inventoryList.innerHTML = '';

    if (player.inventory.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'Инвентарь пуст.';
        inventoryList.appendChild(emptyMessage);
    } else {
        player.inventory.forEach((item, index) => {
            const itemElement = document.createElement('li');
            itemElement.classList.add('inventory-modal__item');

            const icon = document.createElement('img');
            icon.src = items[item]?.icon || '';
            icon.alt = items[item]?.name || item;
            icon.classList.add('inventory-modal__icon');

            itemElement.addEventListener('click', () => {
                useItemFromInventory(index, mode);
            });

            const itemName = document.createElement('span');
            itemName.textContent = items[item]?.name || item;

            const itemDesc = document.createElement('p');
            itemDesc.classList.add('inventory-modal__description');
            itemDesc.textContent = items[item]?.description || '';

            itemElement.appendChild(icon);
            const textWrapper = document.createElement('div');
            textWrapper.appendChild(itemName);
            textWrapper.appendChild(itemDesc);

            itemElement.appendChild(textWrapper);
            inventoryList.appendChild(itemElement);
        });
    }

    inventoryModal.classList.remove('hidden');
}

function closeInventory() {
    inventoryModal.classList.add('hidden');
}

function useItemFromInventory(index, mode = 'peace') {
    const itemId = player.inventory[index];
    const item = items[itemId];

    if (!item) {
        logEvent('Неизвестный предмет.');
        return;
    }

    item.effect();
    player.inventory.splice(index, 1);

    if (mode === 'battle') {
        closeInventory();
    } else {
        openInventory();
    }

    updatePlayerUI();
}

function tryDropLoot(enemy) {
    if (!enemy.drops || enemy.drops.length === 0) return;

    const dropChance = 0.3; // 30% шанс

    if (Math.random() < dropChance) {
        if (player.inventory.length >= 10) {
            logEvent('Ваш инвентарь переполнен. Предмет выпал, но вы не смогли его подобрать.');
            return;
        }
        
        const itemIndex = Math.floor(Math.random() * enemy.drops.length);
        const droppedItem = enemy.drops[itemIndex];

        player.inventory.push(droppedItem);
        logEvent(`Вы нашли предмет: ${items[droppedItem]?.name || droppedItem}!`);
    }
}

function restInVillage() {
    const restored = player.maxHP - player.currentHP;

    if (restored === 0) {
        logEvent('Вы уже полностью восстановлены.');
        return;
    }

    player.currentHP = player.maxHP;
    updatePlayerUI();

    logEvent(`Вы отдохнули в деревне и восстановили ${restored} HP.`);
}

function gainExperience(amount) {
    player.experience += amount;
    logEvent(`Вы получили ${amount} опыта.`);

    // Проверка: хватило ли опыта на новый уровень
    while (player.experience >= player.experienceToNextLevel) {
        player.experience -= player.experienceToNextLevel;
        levelUp();
    }
}

function levelUp() {
    player.level++;
    player.maxHP += 20; // увеличиваем максимум HP
    player.strength += 3; // увеличиваем силу
    player.defense += 2; // увеличиваем защиту
    player.currentHP = player.maxHP; // полностью восстанавливаем здоровье
    player.experienceToNextLevel = Math.floor(player.experienceToNextLevel * 1.5); // увеличиваем планку XP

    logEvent(`Поздравляем! Вы достигли ${player.level} уровня!`);
    updatePlayerUI();
}

function updateEnemyUI() {
    enemyHP.textContent = `HP: ${Math.max(0, currentEnemy.currentHP)}/${currentEnemy.maxHP}`;
}

function updatePlayerUI() {
    const playerHP = document.querySelector('.character-panel__hp-value');
    playerHP.textContent = `${Math.max(0, player.currentHP)}/${player.maxHP}`;

    const experienceValue = document.querySelector('.character-panel__experience-value');
    experienceValue.textContent = `${player.experience}/${player.experienceToNextLevel}`;

    const levelValue = document.querySelector('.character-panel__level-value');
    levelValue.textContent = player.level;
}

startForm.addEventListener('submit', startGame);
resetButton.addEventListener('click', resetGame);
restartButton.addEventListener('click', () => {
    location.reload();
});

// Мирные действия
dungeonButton.addEventListener('click', () => {
    changeState('dungeon');
    logEvent('Вы спустились в подземелье.');
});

forestButton.addEventListener('click', () => {
    changeState('forest');
    logEvent('Вы отправились в лес.');
});

ruinsButton.addEventListener('click', () => {
    changeState('ruins');
    logEvent('Вы отправились исследовать руины.');
});

returnButton.addEventListener('click', () => {
    changeState('village');
    logEvent('Вы вернулись в деревню, чтобы отдохнуть и подготовиться.');
});

restButton.addEventListener('click', restInVillage);

// Исследование
exploreButton.addEventListener('click', () => {
    const treasureChance = 0.2;

    if (Math.random() < treasureChance) {
        findTreasure();
    } else {
        startBattle();
    }
});

// Бой
runButton.addEventListener('click', attemptToRun);
attackButton.addEventListener('click', playerAttack);
defendButton.addEventListener('click', playerDefend);

// Работа с инвентарем
inventoryButton.addEventListener('click', () => openInventory('peace'));
useItemButton.addEventListener('click', () => openInventory('battle'));
closeInventoryButton.addEventListener('click', closeInventory);