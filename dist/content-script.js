(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // src/apiUtils.js
  async function waitForItems() {
    return new Promise((resolve) => {
      let tries = 0;
      const interval = setInterval(() => {
        const els = document.querySelectorAll(".inventory_page .itemHolder");
        console.log(`\u{1F50D} \u041F\u043E\u043F\u044B\u0442\u043A\u0430 ${tries + 1}: \u041D\u0430\u0439\u0434\u0435\u043D\u043E ${els.length} \u043A\u0430\u0440\u0442\u043E\u0447\u0435\u043A`);
        if (els.length || ++tries > 10) {
          clearInterval(interval);
          resolve(els);
        }
      }, 300);
    });
  }
  async function getSteamID64(url) {
    var _a;
    try {
      const response = await fetch(`https://steamcommunity.com/id/${url}/?xml=1`);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      return ((_a = xmlDoc.querySelector("steamID64")) == null ? void 0 : _a.textContent) || null;
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0435:", error);
      return null;
    }
  }
  async function getInventory(steamId, appId, contextId) {
    const inventoryUrl = `https://steamcommunity.com/inventory/${steamId}/${appId}/${contextId}?l=english&count=5000`;
    const inventoryResponse = await fetch(inventoryUrl);
    if (!inventoryResponse.ok) throw new Error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044F");
    return await inventoryResponse.json();
  }
  async function getPrice(url, priceCache) {
    if (priceCache[url]) {
      console.log("\u{1F4BE} \u0426\u0435\u043D\u0430 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 \u0432 \u043A\u044D\u0448\u0435:", priceCache[url]);
      return priceCache[url];
    } else {
      console.log("\u{1F4E1} \u041E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0435 \u043A API \u0434\u043B\u044F \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0434\u0430\u043D\u043D\u044B\u0445");
      const response = await chrome.runtime.sendMessage({ action: "getPrice", url });
      if (!response || !response.success) {
        throw new Error((response == null ? void 0 : response.error) || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445");
      }
      const priceData = response.data;
      priceCache[url] = priceData;
      localStorage.setItem("priceCache", JSON.stringify(priceCache));
      return priceData;
    }
  }

  // src/uiUtils.js
  function createControlPanel() {
    const controlPanel = document.createElement("div");
    Object.assign(controlPanel.style, {
      position: "fixed",
      top: "80px",
      right: "20px",
      zIndex: 1e4,
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    });
    document.body.appendChild(controlPanel);
    return controlPanel;
  }
  function createSortButton(controlPanel, itemsWithPrices, container, sortCounter) {
    const button = document.createElement("button");
    button.textContent = `\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E \u0446\u0435\u043D\u0435 \u2191`;
    button.addEventListener("click", () => {
      itemsWithPrices.sort((a, b) => sortCounter === 0 ? b.numericPrice - a.numericPrice : a.numericPrice - b.numericPrice);
      sortCounter = 1 - sortCounter;
      container.innerHTML = "";
      itemsWithPrices.forEach(({ holder }) => container.appendChild(holder));
    });
    controlPanel.appendChild(button);
  }
  function createResetButton(controlPanel, itemsWithPrices, container, originalOrder) {
    const button = document.createElement("button");
    button.textContent = "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0443";
    button.style.marginLeft = "10px";
    button.addEventListener("click", () => {
      container.innerHTML = "";
      originalOrder.forEach(({ holder }) => {
        if (holder) container.appendChild(holder);
      });
    });
    controlPanel.appendChild(button);
  }
  function createTypeFilter(typeMap, controlPanel) {
    const typeFilterPanel = document.createElement("div");
    Object.assign(typeFilterPanel.style, {
      padding: "10px",
      backgroundColor: "#222",
      borderRadius: "5px",
      color: "white",
      fontSize: "13px",
      maxWidth: "200px",
      overflowY: "auto",
      maxHeight: "300px"
    });
    typeFilterPanel.innerHTML = "<b>\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0442\u0438\u043F\u0443:</b><br>";
    controlPanel.appendChild(typeFilterPanel);
    const checkboxStates = {};
    const checkboxes = {};
    let allChecked = false;
    typeMap.forEach((holders, type) => {
      const label = document.createElement("label");
      label.style.display = "block";
      label.style.cursor = "pointer";
      label.style.marginBottom = "5px";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = true;
      checkboxStates[type] = true;
      checkboxes[type] = checkbox;
      checkbox.addEventListener("change", () => {
        checkboxStates[type] = checkbox.checked;
        holders.forEach((h) => {
          h.style.display = checkbox.checked ? "" : "none";
        });
      });
      label.appendChild(checkbox);
      label.append(` ${type}`);
      typeFilterPanel.appendChild(label);
    });
    const toggleContainer = document.createElement("div");
    toggleContainer.style.marginBottom = "10px";
    const toggleAllBtn = document.createElement("button");
    toggleAllBtn.textContent = "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435";
    toggleAllBtn.style.margin = "10px";
    toggleAllBtn.style.padding = "5px 10px";
    toggleAllBtn.style.cursor = "pointer";
    toggleContainer.appendChild(toggleAllBtn);
    typeFilterPanel.prepend(toggleContainer);
    allChecked = Object.values(checkboxes).every((cb) => cb.checked);
    toggleAllBtn.textContent = allChecked ? "\u0421\u043D\u044F\u0442\u044C \u0432\u0441\u0435" : "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435";
    toggleAllBtn.addEventListener("click", () => {
      allChecked = !allChecked;
      Object.entries(checkboxes).forEach(([type, checkbox]) => {
        checkbox.checked = allChecked;
        checkboxStates[type] = allChecked;
        const holders = typeMap.get(type);
        if (holders) {
          holders.forEach((h) => {
            h.style.display = allChecked ? "" : "none";
          });
        }
      });
      toggleAllBtn.textContent = allChecked ? "\u0421\u043D\u044F\u0442\u044C \u0432\u0441\u0435" : "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435";
    });
  }

  // src/utils.js
  function calculateTotalPrice(itemsWithPrices) {
    return itemsWithPrices.reduce((sum, item) => {
      return !isNaN(item.numericPrice) ? sum + item.numericPrice : sum;
    }, 0);
  }

  // src/content-script.js
  (async () => {
    var _a, _b, _c;
    try {
      console.log("\u{1F7E2} \u0421\u043A\u0440\u0438\u043F\u0442 \u0437\u0430\u043F\u0443\u0449\u0435\u043D");
      const appId = 730;
      const contextId = 2;
      const holders = await waitForItems();
      if (!holders.length) {
        console.warn("\u26A0\uFE0F \u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B");
        return;
      }
      const steamId = typeof g_rgProfileData !== "undefined" && g_rgProfileData.steamid || ((_a = window.location.href.match(/\/profiles\/(\d+)/)) == null ? void 0 : _a[1]) || typeof g_steamID !== "undefined" && g_steamID || await getSteamID64((_b = window.location.href.match(/\/id\/([^\/]+)/)) == null ? void 0 : _b[1]) || null;
      const inventory = await getInventory(steamId, appId, contextId);
      if (!inventory) {
        console.warn("\u26A0\uFE0F \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0438\u043D\u0432\u0435\u043D\u0442\u0430\u0440\u044F");
        return;
      }
      const { assets = [], descriptions = [] } = inventory;
      const assetMap = {};
      assets.forEach((asset) => {
        assetMap[asset.assetid] = asset.classid + "_" + asset.instanceid;
      });
      const descriptionMap = {};
      descriptions.forEach((desc) => {
        const key = desc.classid + "_" + desc.instanceid;
        descriptionMap[key] = desc;
      });
      const priceCache = JSON.parse(localStorage.getItem("priceCache")) || {};
      const itemsWithPrices = [];
      const typeMap = /* @__PURE__ */ new Map();
      for (const holder of holders) {
        const itemDiv = holder.querySelector(".item");
        if (!itemDiv) continue;
        const link = holder.querySelector("a.inventory_item_link");
        const assetKey = link && link.href.startsWith("#") ? link.href.slice(link.href.indexOf("#") + 1) : itemDiv.id;
        const assetId = assetKey.split("_")[2];
        const descriptionKey = assetMap[assetId];
        const description = descriptionMap[descriptionKey];
        if (!description) continue;
        const type = description.type || "Other";
        if (!typeMap.has(type)) {
          typeMap.set(type, []);
        }
        typeMap.get(type).push(holder);
        const marketHashName = encodeURIComponent(description.market_hash_name);
        const priceUrl = `https://steamcommunity.com/market/priceoverview/?currency=1&appid=${appId}&market_hash_name=${marketHashName}`;
        const priceData = await getPrice(priceUrl, priceCache);
        const price = (priceData == null ? void 0 : priceData.lowest_price) || "N/A";
        const priceLabel = document.createElement("div");
        priceLabel.textContent = price;
        Object.assign(priceLabel.style, {
          position: "absolute",
          bottom: "0",
          left: "0",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          fontSize: "11px",
          padding: "2px 4px",
          zIndex: "9999",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
          boxSizing: "border-box"
        });
        holder.style.position = "relative";
        holder.appendChild(priceLabel);
        const numericPrice = parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
        itemsWithPrices.push({ holder, numericPrice });
      }
      const controlPanel = createControlPanel();
      const container = (_c = holders[0]) == null ? void 0 : _c.parentElement;
      let sortCounter = 0;
      const originalOrder = itemsWithPrices.map((item) => __spreadValues({}, item));
      createSortButton(controlPanel, itemsWithPrices, container, sortCounter);
      createResetButton(controlPanel, itemsWithPrices, container, originalOrder);
      createTypeFilter(typeMap, controlPanel);
      const totalPrice = calculateTotalPrice(itemsWithPrices);
      const totalPriceDiv = document.createElement("div");
      totalPriceDiv.textContent = `\u{1F4B2} \u041E\u0431\u0449\u0430\u044F \u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C: $${totalPrice.toFixed(2)}`;
      controlPanel.appendChild(totalPriceDiv);
      console.log("\u{1F3C1} \u0418\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D");
    } catch (err) {
      console.error("\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F content-script:", err);
    }
  })();
})();
