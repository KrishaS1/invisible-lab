import { EarthPage } from "./earth/EarthPage";
import { PhysicsPage } from "./physics/PhysicsPage";
import { Route, Routes } from "react-router-dom";

import { BrainLayout } from "./brain/BrainLayout";

import { ArtifactsLesson } from "./brain/ArtifactsLesson";

import { BandsLesson } from "./brain/BandsLesson";

import { EyesLesson } from "./brain/EyesLesson";

import { ListenLesson } from "./brain/ListenLesson";

import { LivePage } from "./brain/LivePage";

import { MovementLesson } from "./brain/MovementLesson";

import { UploadPage } from "./brain/UploadPage";

import { LessonGuide } from "./components/LessonGuide";

import { Header } from "./components/Header";

import { HeartLayout } from "./heart/HeartLayout";

import { BeatLesson } from "./heart/BeatLesson";

import { HeartListenLesson } from "./heart/ListenLesson";

import { RateLesson } from "./heart/RateLesson";

import { BlinkPage } from "./action/BlinkPage";

import { AboutPage } from "./pages/AboutPage";

import { DemoPage } from "./pages/DemoPage";

import { GlossaryPage } from "./pages/GlossaryPage";

import { LearnPage } from "./pages/LearnPage";
import { HomePage } from "./pages/HomePage";

import { MeasurePage } from "./pages/MeasurePage";

import { NotFound } from "./pages/NotFound";

import { SoonPage } from "./pages/SoonPage";



export function App() {

  return (

    <>

      <a className="skip" href="#content">Skip to content</a>

      <Header />

      <main id="content">

        <LessonGuide />

        <Routes>

          <Route path="/" element={<HomePage />} />

          <Route path="/earth/arrivals" element={<EarthPage />} />
          <Route path="/physics/interference" element={<PhysicsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/demo" element={<DemoPage />} />

          <Route path="/glossary" element={<GlossaryPage />} />

          <Route path="/measure" element={<MeasurePage />} />

          <Route path="/about" element={<AboutPage />} />

          <Route path="/action" element={<BlinkPage />} />

          <Route path="/soon/:labId" element={<SoonPage />} />

          <Route path="/brain" element={<BrainLayout />}>

            <Route index element={<EyesLesson />} />

            <Route path="eyes" element={<EyesLesson />} />

            <Route path="bands" element={<BandsLesson />} />

            <Route path="movement" element={<MovementLesson />} />

            <Route path="artifacts" element={<ArtifactsLesson />} />

            <Route path="listen" element={<ListenLesson />} />

            <Route path="upload" element={<UploadPage />} />

            <Route path="live" element={<LivePage />} />

          </Route>

          <Route path="/heart" element={<HeartLayout />}>

            <Route index element={<RateLesson />} />

            <Route path="rate" element={<RateLesson />} />

            <Route path="beat" element={<BeatLesson />} />

            <Route path="listen" element={<HeartListenLesson />} />

          </Route>

          <Route path="*" element={<NotFound />} />

        </Routes>

      </main>

      <footer className="site-footer">

        <p>Invisible Lab is a classroom tool. It is not a medical device. Quiz progress stays in this browser.</p><p><a href="/about">About the project</a> · <a href="/measure">How measurements work</a></p>

      </footer>

    </>

  );

}

