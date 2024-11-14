import json
import numpy as np
import tensorflow as tf
from tf_keras.models import load_model
from flask import Flask, request, jsonify
from tf_keras.preprocessing import image
from flask_cors import CORS

model_type = load_model('clothes_types.h5')

with open('types.json', 'r') as f:
    class_indices_type = json.load(f)

app = Flask(__name__)
CORS(app)

def predict_class(model, img_path, class_indices):
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / 255.0

    prediction = model.predict(img_array)
    class_idx = np.argmax(prediction, axis=1)
    class_name = list(class_indices.keys())[list(class_indices.values()).index(class_idx[0])]
    return class_name

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "Khong co hinh anh"}), 400

    img = request.files['image']
    img_path = "temp_image.jpg"
    img.save(img_path)

    clothing_type = predict_class(model_type, img_path, class_indices_type)
    print("Prediction:", clothing_type)

    return jsonify({
        "loai_quan_ao": clothing_type
    })

if __name__ == '__main__':
    app.run(debug=True)
