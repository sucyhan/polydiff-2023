# MADE BY:
#   - Louis-Philippe Daigle
import json
import os
import random

from PIL import Image, ImageDraw
from pymongo import MongoClient

# Define folder names
folders = ['./server/data/imageJson', './server/data/originalImage', './server/data/modifiedImage']
DB_URL = 'mongodb+srv://admin_log2990:uW3IaldPXSyRguq9@cluster0.onchvch.mongodb.net/?retryWrites=true&w=majority'
DB_NAME = 'GAME_DATA'
DB_COLLECTION_RANKINGS = 'ranking_dev_lp'
DB_RANKING = [{"name":"IRONBOT", "time": 800},{"name":"GLADOS", "time": 900},{"name":"ROBOTO", "time": 1000}]

# Create folders if they don't exist
for folder in folders:
    if not os.path.exists(folder):
        os.makedirs(folder)

client = MongoClient(DB_URL)
db = client[DB_NAME]

# Ask user for number of games to create
num_games = int(input("How many games do you want to create? "))

# Loop through games
for i in range(1, num_games + 1):
    # Define game data
    num_rectangles = 0
    rectangles = []
    quadrant_size = (160, 120)
    max_rectangles = random.randint(3, 9)
    x_list = [0, 1, 2, 3]
    y_list = [0, 1, 2, 3]
    random.shuffle(x_list)
    random.shuffle(y_list)
    for x in x_list:
        for y in y_list:
            if num_rectangles < max_rectangles:
                # Choose random point
                x1 = random.randint(
                    quadrant_size[0] * x, quadrant_size[0] * (x + 1) - 150)
                y1 = random.randint(
                    quadrant_size[1] * y, quadrant_size[1] * (y + 1) - 110)
                # Add rectangle to list
                rectangles.append({"point1": {"x": x1, "y": y1},
                                  "point2": {"x": x1 + random.randint(10, 150), "y": y1 + random.randint(10, 110)}})
                num_rectangles += 1

    db.get_collection(DB_COLLECTION_RANKINGS).delete_one({"gameId":i})
    db.get_collection(DB_COLLECTION_RANKINGS).insert_one({"gameId":i,"singlePlayer": DB_RANKING, "multiPlayer": DB_RANKING})

    game_data = {
        "id": i,
        "title": f"Game {i}",
        "difficulty": "Facile",
        "numberOfDifferences": num_rectangles,
        "differences": [{"rectangles": [rectangles[i]]} for i in range(num_rectangles)]
    }

    # Write game data to file
    with open(f"./server/data/imageJson/{i}.json", "w") as f:
        json.dump(game_data, f)

    # Create original image with random colored rectangles
    original_image = Image.new("RGB", (640, 480), (255, 255, 255))
    draw = ImageDraw.Draw(original_image)
    for r in rectangles:
        x1 = r["point1"]["x"]
        y1 = r["point1"]["y"]
        x2 = r["point2"]["x"]
        y2 = r["point2"]["y"]
        fill_color = (random.randint(0, 255), random.randint(
            0, 255), random.randint(0, 255))
        draw.rectangle((x1, y1, x2, y2), fill=fill_color)
    original_filename = f"{i}.bmp"
    original_filepath = os.path.join("./server/data/originalImage", original_filename)
    original_image.save(original_filepath)

    # Create blank modified image with white background
    modified_image = Image.new("RGB", (640, 480), (255, 255, 255))
    modified_filename = f"{i}.bmp"
    modified_filepath = os.path.join("./server/data/modifiedImage", modified_filename)
    modified_image.save(modified_filepath)


client.close()