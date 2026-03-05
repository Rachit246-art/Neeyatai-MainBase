package simulations

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class GetUsersSimulation extends Simulation {

  val httpProtocol = http
    .baseUrl("https://api.example.com") // Base URL for the API
    .acceptHeader("application/json")    // Common header for JSON APIs
    .contentTypeHeader("application/json") // Common header for JSON APIs

  val scn = scenario("Get Users Scenario")
    .exec(http("Get all users") // Request name for reporting
      .get("/users"))           // Specific endpoint for the GET request

  setUp(
    scn.inject(atOnceUsers(50)) // Inject 50 users at once
  ).protocols(httpProtocol)     // Apply the defined HTTP protocol to the scenario
}