// Instant shell shown while a product page streams in after navigation.
export default function ProductLoading() {
  return (
    <section className="container-x pb-16 pt-6 md:pb-24 md:pt-8" aria-busy="true" aria-label="Loading product">
      <div className="h-4 w-48 animate-pulse bg-sand" />
      <div className="mt-6 grid gap-10 md:mt-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
        <div className="aspect-[4/5] animate-pulse bg-white" />
        <div className="space-y-5 lg:py-4">
          <div className="h-3 w-32 animate-pulse bg-sand" />
          <div className="h-16 w-3/4 animate-pulse bg-sand" />
          <div className="h-20 w-full animate-pulse bg-sand/70" />
          <div className="h-10 w-28 animate-pulse bg-sand" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-16 animate-pulse bg-sand/70" />
            <div className="h-16 animate-pulse bg-sand/70" />
            <div className="h-16 animate-pulse bg-sand/70" />
          </div>
          <div className="h-12 w-full animate-pulse bg-sand" />
        </div>
      </div>
    </section>
  );
}
