/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
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
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-asset-collection.js
  var import_asset_collection_exports = {};
  __export(import_asset_collection_exports, {
    default: () => import_asset_collection_default
  });

  // tools/importer/parsers/collection-hero.js
  function parse(element, { document }) {
    var _a;
    const titleEl = element.querySelector('h1.j-collection-name, h1, [class*="collection-name"]');
    const title = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
    const assetCountEl = element.querySelector('.asset-count-container, [class*="asset-count"]');
    let assetCount = "";
    if (assetCountEl) {
      const parts = Array.from(assetCountEl.querySelectorAll("span")).map((s) => s.textContent.trim()).filter(Boolean);
      assetCount = parts.length ? parts.join(" ") : assetCountEl.textContent.replace(/\s+/g, " ").trim();
    }
    const collectionsLabel = (((_a = element.querySelector(".search-dropdown__title, .collections-dropdown")) == null ? void 0 : _a.textContent) || "").replace(/\s+/g, " ").trim();
    const shareEl = element.querySelector('.share-button, [class*="share"]');
    const shareLabel = shareEl ? shareEl.textContent.replace(/\s+/g, " ").trim() || "Share Collection" : "";
    const backEl = element.querySelector('.m-brandfolder-tagline a, a[href*="portals"]');
    const backLabel = backEl ? backEl.textContent.replace(/\s+/g, " ").trim() : "";
    const backHref = backEl ? backEl.getAttribute("href") || "" : "";
    if (!title && !assetCount) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const push = (name, value) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(` field:${name} `));
      frag.appendChild(document.createTextNode(value || ""));
      cells.push([frag]);
    };
    push("title", title);
    push("assetCount", assetCount);
    push("collectionsLabel", collectionsLabel);
    push("shareLabel", shareLabel);
    push("backLabel", backLabel);
    const hrefFrag = document.createDocumentFragment();
    hrefFrag.appendChild(document.createComment(" field:backHref "));
    if (backHref) {
      const a = document.createElement("a");
      a.setAttribute("href", backHref);
      a.textContent = backHref;
      hrefFrag.appendChild(a);
    }
    cells.push([hrefFrag]);
    const block = WebImporter.Blocks.createBlock(document, { name: "collection-hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/asset-grid.js
  function parse2(element, { document }) {
    var _a, _b;
    const sectionName = (((_a = element.querySelector("h2.section-title, .section-title")) == null ? void 0 : _a.textContent) || "").replace(/\s+/g, " ").trim();
    const assetCount = (((_b = element.querySelector("p.asset-count, .asset-count")) == null ? void 0 : _b.textContent) || "").replace(/\s+/g, " ").trim();
    const cards = Array.from(element.querySelectorAll("li.card-wrapper"));
    if (!cards.length && !sectionName) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const nameCell = document.createDocumentFragment();
    if (sectionName) {
      nameCell.appendChild(document.createComment(" field:sectionName "));
      nameCell.appendChild(document.createTextNode(sectionName));
    }
    const countCell = document.createDocumentFragment();
    if (assetCount) {
      countCell.appendChild(document.createComment(" field:assetCount "));
      countCell.appendChild(document.createTextNode(assetCount));
    }
    cells.push([nameCell, countCell]);
    cards.forEach((card) => {
      const img = card.querySelector(".card-thumbnail img.image-div") || card.querySelector(".card-thumbnail img[alt]") || card.querySelector(".card-thumbnail img") || card.querySelector("img");
      const titleBtn = card.querySelector("button.asset-name, .asset-name");
      let title = "";
      if (titleBtn) {
        const tooltipLabel = titleBtn.querySelector(".tooltip-component > span");
        title = (tooltipLabel ? tooltipLabel.textContent : titleBtn.textContent).replace(/\s+/g, " ").trim();
      }
      const pill = card.querySelector(".file-type-pill");
      let attachments = "";
      if (pill) {
        const m = pill.textContent.replace(/\s+/g, " ").match(/(\d+)/);
        if (m) attachments = m[1];
      }
      const imageCell = document.createDocumentFragment();
      if (img) {
        imageCell.appendChild(document.createComment(" field:image "));
        const picture = document.createElement("picture");
        const newImg = document.createElement("img");
        newImg.setAttribute("src", img.getAttribute("src") || "");
        const altText = img.getAttribute("alt") || title;
        if (altText) newImg.setAttribute("alt", altText);
        picture.appendChild(newImg);
        imageCell.appendChild(picture);
      }
      const titleCell = document.createDocumentFragment();
      if (title) {
        titleCell.appendChild(document.createComment(" field:title "));
        titleCell.appendChild(document.createTextNode(title));
      }
      const attCell = document.createDocumentFragment();
      if (attachments) {
        attCell.appendChild(document.createComment(" field:attachments "));
        attCell.appendChild(document.createTextNode(attachments));
      }
      const downloadCell = document.createDocumentFragment();
      cells.push([imageCell, titleCell, attCell, downloadCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "asset-grid", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/brandfolder-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#lanyard_root",
        "#ketch-banner",
        "#ketch-consent-banner",
        ".j-header-resource-globals"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#dialog",
        ".modal.fade",
        "#close-modal",
        "#no-cookies",
        ".s-noscript-overlay"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#engagement-wrapper",
        "#layers"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#navbar-static",
        ".skip"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".m-color-bar"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "#section-sort-list",
        ".custom_section_title"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "nav.filters-drawer",
        ".advanced-filters-container"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".filter-button-container",
        ".search-input-container",
        ".search-and-view-details"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".pagination",
        ".processing-loader-container",
        ".loading"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".brandfolder-footer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "link",
        "iframe",
        "noscript",
        "script",
        "style"
      ]);
    }
  }

  // tools/importer/import-asset-collection.js
  var parsers = {
    "collection-hero": parse,
    "asset-grid": parse2
  };
  var transformers = [
    transform
  ];
  var PAGE_TEMPLATE = {
    name: "asset-collection",
    description: "Brandfolder digital asset library page: a branded hero header with title/asset count/collections, followed by a series of asset-collection sections, each with a section heading and a responsive grid of asset cards (image thumbnails with titles).",
    urls: [
      "https://brandfolder.com/databricks/dais-2026"
    ],
    blocks: [
      {
        name: "collection-hero",
        instances: [
          "#m-brandfolder-show-container > div.s-brandfolder-show > div.m-brandfolder-header-container"
        ]
      },
      {
        name: "asset-grid",
        instances: [
          "article.section-container.card-view"
        ]
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_asset_collection_default = {
    /**
     * Brandfolder virtualizes the asset grid: only sections near the viewport keep
     * their cards mounted. A single scroll-to-bottom leaves middle sections empty.
     * Scroll each collection section into view sequentially and wait for its cards
     * to lazy-load; once loaded they remain mounted for the capture that follows.
     */
    onLoad: (_0) => __async(void 0, [_0], function* ({ document }) {
      const sleep = (ms) => new Promise((r) => {
        setTimeout(r, ms);
      });
      const sections = Array.from(document.querySelectorAll("article.section-container.card-view"));
      for (let i = 0; i < sections.length; i += 1) {
        const art = sections[i];
        art.scrollIntoView({ block: "center" });
        for (let t = 0; t < 10; t += 1) {
          yield sleep(500);
          if (art.querySelectorAll("li.card-wrapper").length > 0) break;
        }
      }
      window.scrollTo(0, 0);
      yield sleep(1e3);
    }),
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_asset_collection_exports);
})();
