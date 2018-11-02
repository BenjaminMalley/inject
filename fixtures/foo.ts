declare namespace quux {
  interface Corge {
  }
}

interface Foo { };
interface Bar {
  foo: Foo
};
interface Baz {
  corge: quux.Corge,
};

export function provideFoo(): Foo {
  return {};
}

export function provideBar(foo: Foo): Bar {
  return {
    foo,
  };
}

export function provideBaz(corge: quux.Corge): Baz {
  return {
    corge,
  };
}

export function provideCorge(): quux.Corge {
  return {};
}

export async function provideBarAsync() {
  return new Promise<Bar>(resolve => {
    return {};
  });
}
