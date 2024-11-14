import numpy as np
import tensorflow as tf
from tf_keras.preprocessing.image import ImageDataGenerator
from tf_keras.applications import MobileNetV2
from tf_keras import layers, models
import json

clothing_type_dir = 'dataseta/'

datagen = ImageDataGenerator(
    rescale=1./255,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    validation_split=0.2
)

train_generator = datagen.flow_from_directory(
    clothing_type_dir,
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='training'
)

validation_generator = datagen.flow_from_directory(
    clothing_type_dir,
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    subset='validation'
)

# Load the pre-trained MobileNetV2 model without the top layers (include_top=False)
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Freeze the layers of the base model so they won't be trained
base_model.trainable = False

model_type = models.Sequential([
    base_model,  # Add the pre-trained base model
    layers.Flatten(),
    layers.Dense(512, activation='relu'),
    layers.Dropout(0.5),
    layers.Dense(train_generator.num_classes, activation='softmax')
])


model_type.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model_type.summary()

history = model_type.fit(
    train_generator,
    epochs=100,
    batch_size=4,
    validation_data=validation_generator,
)

model_type.save('clothes_types.h5')

class_indices_type = train_generator.class_indices
with open('types.json', 'w') as f:
    json.dump(class_indices_type, f)

print("Loại quần áo:")
for class_name, class_idx in class_indices_type.items():
    print(f'{class_idx}: {class_name}')

last_epoch_data = {
    "train_accuracy": history.history['accuracy'][-1],
    "val_accuracy": history.history['val_accuracy'][-1],
    "train_loss": history.history['loss'][-1],
    "val_loss": history.history['val_loss'][-1]
}

with open('lịch_sử_huấn_luyện.json', 'w') as f:
    json.dump(last_epoch_data, f)

