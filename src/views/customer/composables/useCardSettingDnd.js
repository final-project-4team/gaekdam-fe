// src/views/customer/composables/useCardSettingDnd.js
import { computed, ref } from "vue";

/**
 * @param {object} args
 * @param {string} args.lsKey
 * @param {function} args.defaultCardSetting  () => cardSetting[]
 */
export function useCardSettingDnd({ lsKey, defaultCardSetting }) {
    const showCardSettingModal = ref(false);

    const normalizeCardSetting = (list) => {
        const arr = Array.isArray(list) ? list : [];
        const left = arr.filter((x) => x.column === "left");
        const right = arr.filter((x) => x.column === "right");

        const fix = (items) => {
            const hasOrder = items.every((x) => typeof x.order === "number");
            if (hasOrder) return items;

            return items.map((x, idx) => ({
                ...x,
                order: typeof x.order === "number" ? x.order : idx + 1,
            }));
        };

        return [...fix(left), ...fix(right)];
    };

    const cardSettings = ref(defaultCardSetting());

    const loadCardSetting = () => {
        try {
            const raw = localStorage.getItem(lsKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length) {
                cardSettings.value = normalizeCardSetting(parsed);
            }
        } catch (e) {}
    };
    loadCardSetting();

    const cardSettingsDraft = ref(JSON.parse(JSON.stringify(cardSettings.value)));

    const leftCards = computed(() =>
        cardSettings.value
            .filter((c) => c.enabled && c.column === "left")
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    );

    const rightCards = computed(() =>
        cardSettings.value
            .filter((c) => c.enabled && c.column === "right")
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    );

    const draftLeft = computed(() =>
        cardSettingsDraft.value
            .filter((c) => c.column === "left")
            .slice()
            .sort((a, b) => {
                if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
                return (a.order ?? 999) - (b.order ?? 999);
            })
    );

    const draftRight = computed(() =>
        cardSettingsDraft.value
            .filter((c) => c.column === "right")
            .slice()
            .sort((a, b) => {
                if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
                return (a.order ?? 999) - (b.order ?? 999);
            })
    );

    const reflowColumn = (column) => {
        const list = cardSettingsDraft.value
            .filter((x) => x.column === column)
            .slice()
            .sort((a, b) => {
                if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
                return (a.order ?? 999) - (b.order ?? 999);
            });

        list.forEach((item, idx) => {
            item.order = idx + 1;
        });
    };

    const onToggleEnabled = (column) => {
        reflowColumn(column);
    };

    const onCardSetting = () => {
        cardSettingsDraft.value = JSON.parse(JSON.stringify(cardSettings.value));
        reflowColumn("left");
        reflowColumn("right");
        showCardSettingModal.value = true;
    };

    const saveCardSetting = () => {
        cardSettings.value = normalizeCardSetting(JSON.parse(JSON.stringify(cardSettingsDraft.value)));
        localStorage.setItem(lsKey, JSON.stringify(cardSettings.value));
        showCardSettingModal.value = false;
    };

    const resetCardSetting = () => {
        cardSettingsDraft.value = defaultCardSetting();
        reflowColumn("left");
        reflowColumn("right");
    };

    /* =========================
       drag UX
       ========================= */
    const dragState = ref({ id: null, column: null });
    const overState = ref({ column: null, index: null });

    const isOver = (column, index) => {
        return dragState.value.id && overState.value.column === column && overState.value.index === index;
    };

    const showIndicator = (column, index) => {
        if (!dragState.value.id) return false;
        return isOver(column, index);
    };

    const createDragGhost = (e) => {
        try {
            const target = e.currentTarget;
            if (!target) return;

            const ghost = target.cloneNode(true);
            ghost.classList.add("drag-ghost");
            ghost.style.width = `${target.getBoundingClientRect().width}px`;
            document.body.appendChild(ghost);

            const rect = target.getBoundingClientRect();
            const offsetX = Math.min(24, rect.width / 4);
            const offsetY = Math.min(18, rect.height / 2);
            e.dataTransfer.setDragImage(ghost, offsetX, offsetY);

            setTimeout(() => {
                if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
            }, 0);
        } catch (_) {}
    };

    const onDragStart = (e, id, column) => {
        dragState.value = { id, column };
        overState.value = { column, index: null };

        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(id));
        createDragGhost(e);
    };

    const onDragEnter = (column, index) => {
        if (!dragState.value.id || dragState.value.column !== column) return;
        overState.value = { column, index };
    };

    const onDragOver = (column, index) => {
        if (!dragState.value.id || dragState.value.column !== column) return;
        overState.value = { column, index };
    };

    const onDragLeave = (column, index) => {
        if (!dragState.value.id) return;
        if (overState.value.column === column && overState.value.index === index) {
            overState.value = { column: dragState.value.column, index: null };
        }
    };

    const applyOrder = (orderedList) => {
        orderedList.forEach((item, idx) => {
            item.order = idx + 1;
        });
    };

    const onDropAt = (column, targetIndex) => {
        const { id: dragId, column: dragCol } = dragState.value;
        if (!dragId || dragCol !== column) return;

        const list = (column === "left" ? draftLeft.value : draftRight.value).slice();
        const fromIndex = list.findIndex((x) => x.id === dragId);
        if (fromIndex < 0) return;

        const toIndex = Math.max(0, Math.min(targetIndex, list.length));
        const [moved] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, moved);

        applyOrder(list);
        reflowColumn(column);

        overState.value = { column, index: null };
    };

    const onDragEnd = () => {
        dragState.value = { id: null, column: null };
        overState.value = { column: null, index: null };
    };

    return {
        // modal
        showCardSettingModal,
        onCardSetting,
        saveCardSetting,
        resetCardSetting,

        // render lists
        leftCards,
        rightCards,
        draftLeft,
        draftRight,
        cardSettingsDraft,

        // toggle
        onToggleEnabled,

        // dnd
        dragState,
        isOver,
        showIndicator,
        onDragStart,
        onDragEnter,
        onDragOver,
        onDragLeave,
        onDropAt,
        onDragEnd,
    };
}
