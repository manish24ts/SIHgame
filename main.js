// Game Configuration
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);

// Game Variables
let compost = 50;
let plants = [];
let garlicPlants = []; // Separate array for garlic for easy collision detection
let pests = [];
let grid = [];
let plantSelected = null;
let compostText;
let gameOver = false;

const PLANT_COSTS = {
    'marigold': 50,
    'garlic': 50
};

// Scene Functions
function preload() {
    // --- Load Sprites (Replace with your URLs) ---
    this.load.image('loamySoil', 'assets/loamy_soil_bg.png');
    this.load.image('marigold', 'assets/marigold_plant.png');
    this.load.image('marigoldProjectile', 'assets/marigold_flower.png');
    this.load.image('garlic', 'assets/garlic_bulb.png');
    this.load.image('aphid', 'assets/aphid_pest.png');

    // UI elements
    this.load.image('plantCard', 'assets/plant_card.png');
}

function create() {
    // Game Background
    this.add.image(450, 300, 'loamySoil').setDisplaySize(900, 600);

    // Set up the grid
    for (let i = 0; i < 5; i++) {
        grid[i] = [];
        for (let j = 0; j < 9; j++) {
            grid[i][j] = null; // null for empty cell
        }
    }

    // UI
    compostText = this.add.text(10, 10, 'Compost: ' + compost, { fontSize: '24px', fill: '#fff' });

    // Plant Selection UI
    const cardScale = 0.5;
    const cardY = 50;
    const cardXOffset = 80;
    const cardNames = ['marigold', 'garlic'];
    
    cardNames.forEach((name, index) => {
        let card = this.add.image(100 + index * cardXOffset, cardY, 'plantCard').setScale(cardScale).setInteractive();
        let plantSprite = this.add.image(card.x, card.y, name).setScale(0.2);
        let costText = this.add.text(card.x, card.y + 20, PLANT_COSTS[name], { fontSize: '12px', fill: '#000' }).setOrigin(0.5);

        card.on('pointerdown', () => {
            if (compost >= PLANT_COSTS[name]) {
                plantSelected = name;
                console.log(name + ' selected.');
            } else {
                console.log('Not enough compost!');
            }
        });
    });

    // Grid interaction
    this.input.on('pointerdown', (pointer) => {
        if (gameOver || !plantSelected) return;

        // Calculate grid position
        const row = Math.floor((pointer.y - 120) / 90);
        const col = Math.floor((pointer.x - 200) / 90);

        if (row >= 0 && row < 5 && col >= 0 && col < 9 && grid[row][col] === null) {
            
            let plantSprite;
            const xPos = 200 + col * 90;
            const yPos = 120 + row * 90;

            if (plantSelected === 'marigold') {
                plantSprite = this.physics.add.sprite(xPos, yPos, 'marigold').setScale(0.3).setImmovable();
                plantSprite.health = 100;
                plants.push(plantSprite);
            } else if (plantSelected === 'garlic') {
                plantSprite = this.physics.add.sprite(xPos, yPos, 'garlic').setScale(0.3).setImmovable();
                plantSprite.isGarlic = true;
                garlicPlants.push(plantSprite);
            }

            if (plantSprite) {
                compost -= PLANT_COSTS[plantSelected];
                compostText.setText('Compost: ' + compost);
                grid[row][col] = plantSelected;
                plantSelected = null;
            }
        }
    });

    // Automatic Compost Generation
    this.time.addEvent({
        delay: 5000,
        callback: () => {
            if (!gameOver) {
                compost += 25;
                compostText.setText('Compost: ' + compost);
            }
        },
        loop: true
    });

    // Pest Spawning
    this.time.addEvent({
        delay: 5000,
        callback: () => {
            if (!gameOver) {
                const row = Phaser.Math.Between(0, 4);
                let aphid = this.physics.add.sprite(900, 120 + row * 90, 'aphid').setScale(0.1);
                aphid.health = 50;
                aphid.speed = 20;
                pests.push(aphid);
            }
        },
        loop: true
    });

    // Colliders
    this.physics.add.collider(pests, plants, (pest, plant) => {
        // Pests stop and "eat" plants
        pest.body.setVelocityX(0);
        // This is where you would handle damage
        // For simplicity, we just stop the pest for now
    });

    this.physics.add.overlap(pests, garlicPlants, (pest, garlic) => {
        // Garlic explodes!
        pest.health -= 50;
        if (pest.health <= 0) {
            pest.destroy();
        }
        garlic.destroy();
        garlicPlants.splice(garlicPlants.indexOf(garlic), 1);
    });
}

function update(time, delta) {
    if (gameOver) return;

    // Pests movement
    pests.forEach(pest => {
        if (pest.body.velocity.x === 0) return; // Don't move if eating a plant
        pest.body.setVelocityX(-pest.speed);
    });

    // Marigold Actions
    plants.forEach(plant => {
        const enemiesInRow = pests.filter(p => Math.floor((p.y - 120) / 90) === Math.floor((plant.y - 120) / 90));
        
        if (enemiesInRow.length > 0) {
            // Placeholder: Marigold attacks.
            // A more complete version would check a timer.
            // The code for firing a projectile would go here, similar to the previous example.
        }
    });

    // Check for game over
    pests.forEach((pest, index) => {
        if (pest.x < 150) {
            gameOver = true;
            this.add.text(config.width / 2, config.height / 2, 'GAME OVER', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5);
        }
    });
}