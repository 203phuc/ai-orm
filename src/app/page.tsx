export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xl text-lg md:text-3xl md:text-center font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Welcome to an AI-powered response review app.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for review responses? Head over to{" "}
          </p>
        </div>
        <input className="w-50 h-10 bg-amber-50" />
      </main>
    </div>
  );
}
