import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@2.0.3/+esm";

const NAMESPACE = "com.dnd-shop.token-tools";

const originalKey = `${NAMESPACE}/original`;

async function getSelectedTokens() {
  const selection = await OBR.player.getSelection();
  if (!selection.length) return [];
  const items = await OBR.scene.items.getItems(selection);
  return items.filter((item) => item.type === "IMAGE");
}

async function storeOriginalDimensions(tokens) {
  await OBR.scene.items.updateItems(
    tokens.map((token) => token.id),
    (items) => {
      for (const item of items) {
        if (!item.metadata[originalKey]) {
          item.metadata[originalKey] = {
            imageUrl: item.image.url,
            width: item.image.width,
            height: item.image.height,
            scale: { ...item.scale },
          };
        }
      }
    }
  );
}

async function swapTokenImage(newImageUrl) {
  const tokens = await getSelectedTokens();
  if (!tokens.length) return;

  await storeOriginalDimensions(tokens);

  await OBR.scene.items.updateItems(
    tokens.map((token) => token.id),
    (items) => {
      for (const item of items) {
        const original = item.metadata[originalKey];
        item.image.url = newImageUrl;
        item.image.width = original.width;
        item.image.height = original.height;
        item.scale = { ...original.scale };
      }
    }
  );
}

async function resizeTokens(multiplier) {
  const tokens = await getSelectedTokens();
  if (!tokens.length) return;

  await storeOriginalDimensions(tokens);

  await OBR.scene.items.updateItems(
    tokens.map((token) => token.id),
    (items) => {
      for (const item of items) {
        item.scale.x *= multiplier;
        item.scale.y *= multiplier;
      }
    }
  );
}

async function revertTokens() {
  const tokens = await getSelectedTokens();
  if (!tokens.length) return;

  await OBR.scene.items.updateItems(
    tokens.map((token) => token.id),
    (items) => {
      for (const item of items) {
        const original = item.metadata[originalKey];
        if (!original) continue;
        item.image.url = original.imageUrl;
        item.image.width = original.width;
        item.image.height = original.height;
        item.scale = { ...original.scale };
        delete item.metadata[originalKey];
      }
    }
  );
}

OBR.onReady(() => {
  // Example bindings. Replace these with your UI controls.
  window.swapTokenImage = swapTokenImage;
  window.resizeTokens = resizeTokens;
  window.revertTokens = revertTokens;
});
