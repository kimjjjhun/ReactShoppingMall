import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useCookies } from "react-cookie";
import { ProductType } from "../types";
import { getProduct } from "../utils/api";

type CartType = ProductType & { count: number };

const COOKIE_KEY = "cart" as const;

const useCart = () => {
  const [cookies, setCookies] = useCookies([COOKIE_KEY]);
  const [carts, setCarts] = useState<CartType[]>([]);

  const productIds = useMemo(
    () => (cookies[COOKIE_KEY] as string[]) ?? [],
    [cookies]
  );

  const addCarts = (id: string) => {
    const nextCartIds = [...productIds, id];
    setCookies(COOKIE_KEY, nextCartIds, {
      path: "/",
    });
  };

  const changeCount = (productId: string, mode: "increase" | "decrease") => {
    const index = productIds.indexOf(productId);
    if (index === -1) {
      return;
    }

    if (mode === "decrease") {
      const tempArr = [...productIds];
      tempArr.splice(index, 1);

      if (!tempArr.includes(productId)) {
        return;
      }

      setCookies(COOKIE_KEY, tempArr, {
        path: "/",
      });
    }

    if (mode === "increase") {
      setCookies(COOKIE_KEY, [...productIds, productId], {
        path: "/",
      });
    }
  };

  const removeFromCart = (productId: string) => {
    const nextCartIds = productIds.filter((id) => id !== productId);

    // 쿠키 업데이트
    setCookies(COOKIE_KEY, nextCartIds, {
      path: "/",
    });

    // 현재 상태에서 해당 상품 제거
    setCarts((prevCarts) => prevCarts.filter((cart) => cart.id !== productId));
  };

  const clearCart = () => {
    // 쿠키 초기화
    setCookies(COOKIE_KEY, [], {
      path: "/",
    });

    // 로컬 상태 초기화
    setCarts([]);
  };

  useEffect(() => {
    if (productIds.length) {
      const requestList: Array<Promise<any>> = [];
      const requestIds = productIds.reduce(
        (acc, cur) => acc.set(cur, (acc.get(cur) || 0) + 1),
        new Map<string, number>()
      );

      Array.from(requestIds.keys()).forEach((id) => {
        requestList.push(getProduct(id));
      });

      Promise.all(requestList).then((responseList) => {
        const cartsData: CartType[] = responseList.map((response) => ({
          ...response.data.product,
          count: requestIds.get(response.data.product.id),
        }));
        setCarts(cartsData);
      });
    } else {
      // productIds가 비어있을 경우 carts도 초기화
      setCarts([]);
    }
  }, [productIds]);

  return {
    carts,
    addCarts,
    changeCount,
    removeFromCart,
    clearCart, // clearCart 추가
  };
};

export default useCart;
